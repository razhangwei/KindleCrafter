# Chapter 19: External APIs & AI

## Learning Objectives

By the end of this chapter, you will:

- Understand how to integrate external REST APIs
- Parse and process RSS feeds
- Work with AI APIs (Google Gemini)
- Handle large file uploads to AI services
- Design effective AI prompts for structured output
- See how KindleCrafter extracts and transcribes podcasts

---

## The Podcast Pipeline

KindleCrafter's podcast feature chains multiple external APIs:

```
Apple Podcast URL
        │
        ▼
┌───────────────────┐
│ iTunes Lookup API │ ← Get RSS feed URL, episode GUID
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ RSS Feed          │ ← Parse XML, find audio URL
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Audio Download    │ ← Fetch MP3/M4A file
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Gemini AI         │ ← Transcribe + format
└─────────┬─────────┘
          │
          ▼
    Markdown Transcript
```

---

## Working with REST APIs

### The iTunes Lookup API

Apple provides a free API to look up podcast metadata:

```typescript
// lib/podcast.ts

async function getRssFeedUrl(podcastId: string): Promise<{
  feedUrl: string;
  podcastName: string;
}> {
  // Construct the API URL
  const lookupUrl = `https://itunes.apple.com/lookup?id=${podcastId}&entity=podcast`;

  // Make the request
  const response = await fetch(lookupUrl);

  // Check for errors
  if (!response.ok) {
    throw new Error(`iTunes API request failed: ${response.status}`);
  }

  // Parse JSON response
  const data = await response.json();

  // Validate the response structure
  if (!data.results || data.results.length === 0) {
    throw new Error("Podcast not found on iTunes");
  }

  // Extract what we need
  const feedUrl = data.results[0].feedUrl;
  const podcastName = data.results[0].collectionName || "Unknown Podcast";

  if (!feedUrl) {
    throw new Error("RSS feed URL not available for this podcast");
  }

  return { feedUrl, podcastName };
}
```

### Key Patterns

1. **Construct URL with parameters**: Template literals work well
2. **Check response.ok**: Status codes 200-299 are ok
3. **Parse with response.json()**: For JSON APIs
4. **Validate response structure**: Don't assume the shape
5. **Extract and return what's needed**: Don't pass entire response

---

## Parsing RSS Feeds

RSS feeds are XML documents. KindleCrafter parses them with string matching:

```typescript
// lib/podcast.ts

async function parseRssFeed(
  feedUrl: string,
  episodeGuid: string,
  podcastName: string
): Promise<RSSEpisode> {
  // Fetch the RSS feed
  const response = await fetch(feedUrl, {
    headers: {
      "User-Agent": "KindleCrafter/1.0",  // Identify ourselves
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.status}`);
  }

  const xmlText = await response.text();

  // Find all <item> elements (episodes)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];

    // Extract GUID
    const guidMatch = itemXml.match(
      /<guid[^>]*>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/guid>/
    );

    // Extract audio URL
    const enclosureMatch = itemXml.match(
      /<enclosure[^>]+url=["']([^"']+)["']/
    );

    // Match by GUID
    if (guidMatch?.[1] === episodeGuid && enclosureMatch) {
      return {
        title: extractXmlContent(itemXml, "title") || "Untitled",
        guid: guidMatch[1],
        enclosureUrl: enclosureMatch[1],
        duration: itemXml.match(/<itunes:duration>([^<]+)<\/itunes:duration>/)?.[1],
        podcastName,
      };
    }
  }

  throw new Error("Episode not found in RSS feed");
}

function extractXmlContent(xml: string, tag: string): string | undefined {
  // Handle CDATA sections: <tag><![CDATA[content]]></tag>
  const regex = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`,
    "i"
  );
  return xml.match(regex)?.[1]?.trim();
}
```

### Why Not Use an XML Parser?

For simple extraction, regex is lighter than a full XML parser. However:
- Complex XML → Use a proper parser
- Need validation → Use a proper parser
- Simple data extraction → Regex is fine

---

## Working with AI APIs

### Google Gemini Setup

```typescript
// lib/podcast.ts

import { GoogleGenAI } from "@google/genai";

export async function transcribePodcast(
  audioUrl: string,
  metadata: PodcastMetadata
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenAI({ apiKey });

  // Download the audio file
  const audioResponse = await fetch(audioUrl, {
    headers: { "User-Agent": "KindleCrafter/1.0" },
  });

  if (!audioResponse.ok) {
    throw new Error(`Failed to download audio: ${audioResponse.status}`);
  }

  const audioBuffer = await audioResponse.arrayBuffer();
  const audioSize = audioBuffer.byteLength;
  const mimeType = audioResponse.headers.get("content-type") || "audio/mpeg";

  // Build the prompt
  const prompt = buildTranscriptionPrompt(metadata);

  let result;

  // Large files use the Files API
  if (audioSize > 20 * 1024 * 1024) {  // > 20MB
    result = await transcribeWithFilesAPI(genAI, audioBuffer, mimeType, prompt);
  } else {
    result = await transcribeInline(genAI, audioBuffer, mimeType, prompt);
  }

  return result;
}
```

### Handling Large Files

Gemini has two ways to send media:

```typescript
// Small files: inline base64
async function transcribeInline(genAI, audioBuffer, mimeType, prompt) {
  const audioBase64 = Buffer.from(audioBuffer).toString("base64");

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{
      role: "user",
      parts: [
        { inlineData: { data: audioBase64, mimeType } },
        { text: prompt },
      ],
    }],
  });

  return result.text;
}

// Large files: upload first
async function transcribeWithFilesAPI(genAI, audioBuffer, mimeType, prompt) {
  // Upload file
  const uploadResult = await genAI.files.upload({
    file: new Blob([audioBuffer], { type: mimeType }),
    config: { mimeType },
  });

  // Wait for processing
  let file = uploadResult;
  while (file.state === "PROCESSING") {
    await new Promise(resolve => setTimeout(resolve, 5000));
    file = await genAI.files.get({ name: file.name });
  }

  if (file.state === "FAILED") {
    throw new Error("File processing failed");
  }

  // Generate content with file reference
  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{
      role: "user",
      parts: [
        { fileData: { fileUri: file.uri, mimeType } },
        { text: prompt },
      ],
    }],
  });

  // Clean up
  await genAI.files.delete({ name: file.name });

  return result.text;
}
```

---

## Prompt Engineering

The prompt is critical for getting useful output:

```typescript
function buildTranscriptionPrompt(metadata: PodcastMetadata): string {
  return `You are transcribing a podcast episode for reading on a Kindle e-reader.

PODCAST INFO:
- Title: ${metadata.title}
- Podcast: ${metadata.podcastName}
${metadata.publishDate ? `- Published: ${metadata.publishDate}` : ""}

TRANSCRIPTION REQUIREMENTS:

1. **Format as Markdown** suitable for book reading:
   - Start with a level 1 heading (# Episode Title)
   - Add a brief intro paragraph with podcast name and date

2. **Chapter/Section Headings**:
   - Detect topic changes and insert level 2 headings (##)
   - Create meaningful section titles based on content
   - Aim for 3-8 sections depending on length

3. **Speaker Identification**:
   - Identify speakers by name when mentioned
   - Format as **Speaker Name:** at the start of speech
   - Use "Host:" and "Guest:" if names aren't mentioned

4. **Clean Paragraphs**:
   - Remove filler words: "um", "uh", "like", "you know"
   - Remove false starts and repeated words
   - Break into logical paragraphs (4-6 sentences each)

5. **Do NOT include**:
   - Timestamps
   - [inaudible] markers
   - Ads or sponsor reads (skip entirely)

6. **Maintain Natural Reading Flow**:
   - Output should read like a polished magazine interview
   - Preserve meaning while cleaning up verbal tics

OUTPUT: Provide ONLY the formatted Markdown transcript.`;
}
```

### Prompt Design Principles

1. **Context**: Tell the AI what it's doing and why
2. **Structure**: Use numbered lists and headings
3. **Examples**: Show format with markdown examples
4. **Constraints**: Explicit "do" and "don't" lists
5. **Output format**: Clear instruction on what to return

---

## Error Handling for External APIs

External APIs fail. Plan for it:

```typescript
export async function extractPodcastAudio(appleUrl: string) {
  // Parse the URL
  const { podcastId, episodeId } = parseApplePodcastUrl(appleUrl);
  // ↑ Throws if URL format is wrong

  console.log("[extractPodcastAudio] Looking up:", podcastId, episodeId);

  try {
    // Get episode GUID from iTunes
    const { episodeGuid, episodeTitle } = await getEpisodeGuidFromItunes(
      podcastId,
      episodeId
    );

    // Get RSS feed URL
    const { feedUrl, podcastName } = await getRssFeedUrl(podcastId);

    // Find episode in RSS
    const episode = await parseRssFeed(feedUrl, episodeGuid, podcastName);

    return {
      audioUrl: episode.enclosureUrl,
      metadata: {
        title: episode.title,
        podcastName,
        durationSeconds: parseDuration(episode.duration),
      },
    };
  } catch (error) {
    // Re-throw with context
    throw new Error(
      `Failed to extract podcast: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
```

### API Failure Strategies

| Failure | Strategy |
|---------|----------|
| Network timeout | Retry with backoff |
| Rate limiting (429) | Wait and retry |
| Invalid input | Return user-friendly error |
| API down | Queue for later (Inngest handles this) |
| Malformed response | Validate and throw clear error |

---

## Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAPTER 19 SUMMARY                         │
├─────────────────────────────────────────────────────────────────┤
│  • REST API integration:                                        │
│    fetch(url) → check response.ok → response.json()            │
│                                                                 │
│  • RSS/XML parsing: regex for simple extraction                │
│    Use proper parser for complex documents                      │
│                                                                 │
│  • AI API (Gemini):                                            │
│    Small files: inline base64                                  │
│    Large files: upload to Files API first                       │
│                                                                 │
│  • Prompt engineering:                                          │
│    Context + Structure + Examples + Constraints + Output       │
│                                                                 │
│  • Error handling:                                              │
│    Validate responses, re-throw with context                   │
│    Use Inngest retries for transient failures                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Try It Yourself

1. **Explore iTunes API**: Query the iTunes API for your favorite podcast. What data is available?

2. **Modify the Prompt**: Change the transcription prompt to output bullet points instead of paragraphs.

3. **Add a New API**: Integrate a different API (weather, quotes, etc.) using the patterns from this chapter.

---

## What's Next?

We've covered all the major features. In Part VI, we'll focus on deployment—environment variables, Vercel deployment, and a complete system design review.

→ Continue to [Chapter 20: Environment Variables](../part-6-deployment/20-environment-variables.md)
