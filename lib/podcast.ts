import { GoogleGenAI } from "@google/genai";
import ytdl from "@distube/ytdl-core";

export type SourceType = "apple" | "youtube";

export interface PodcastMetadata {
  title: string;
  podcastName: string;
  durationSeconds?: number;
  publishDate?: string;
  description?: string;
  source?: SourceType;
}

interface RSSEpisode {
  title: string;
  guid: string;
  enclosureUrl: string;
  duration?: string;
  pubDate?: string;
  description?: string;
  podcastName: string;
}

/**
 * Extract podcast ID and episode ID from Apple Podcast URL
 * Format: https://podcasts.apple.com/.../id{podcast-id}?i={episode-id}
 */
export function parseApplePodcastUrl(url: string): { podcastId: string; episodeId: string } {
  const podcastIdMatch = url.match(/\/id(\d+)/);
  const episodeIdMatch = url.match(/[?&]i=(\d+)/);

  if (!podcastIdMatch || !episodeIdMatch) {
    throw new Error(
      "Invalid Apple Podcast URL format. Expected format: https://podcasts.apple.com/.../id{podcast-id}?i={episode-id}"
    );
  }

  return {
    podcastId: podcastIdMatch[1],
    episodeId: episodeIdMatch[1],
  };
}

/**
 * Get RSS feed URL from Apple iTunes Lookup API (no API key needed)
 */
async function getRssFeedUrl(podcastId: string): Promise<{ feedUrl: string; podcastName: string }> {
  const lookupUrl = `https://itunes.apple.com/lookup?id=${podcastId}&entity=podcast`;

  const response = await fetch(lookupUrl);
  if (!response.ok) {
    throw new Error(`iTunes API request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("Podcast not found on iTunes");
  }

  const feedUrl = data.results[0].feedUrl;
  const podcastName = data.results[0].collectionName || data.results[0].trackName || "Unknown Podcast";

  if (!feedUrl) {
    throw new Error("RSS feed URL not available for this podcast");
  }

  return { feedUrl, podcastName };
}

/**
 * Look up episode details from iTunes API to get the RSS GUID
 * Apple's episode IDs don't match RSS GUIDs, so we need to query Apple's API
 */
async function getEpisodeGuidFromItunes(
  podcastId: string,
  episodeId: string
): Promise<{ episodeGuid: string; episodeTitle: string }> {
  // Fetch episodes from iTunes (limit to recent 200 episodes)
  const lookupUrl = `https://itunes.apple.com/lookup?id=${podcastId}&entity=podcastEpisode&limit=200`;

  const response = await fetch(lookupUrl);
  if (!response.ok) {
    throw new Error(`iTunes API request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error("Podcast not found on iTunes");
  }

  // Find the episode with matching trackId (Apple's episode ID)
  const episode = data.results.find(
    (r: { wrapperType: string; trackId: number }) =>
      r.wrapperType === "podcastEpisode" && r.trackId === parseInt(episodeId, 10)
  );

  if (!episode) {
    throw new Error(
      "Episode not found in iTunes. The episode may be too old (only recent 200 episodes are checked) or no longer available."
    );
  }

  if (!episode.episodeGuid) {
    throw new Error("Episode GUID not available from iTunes");
  }

  return {
    episodeGuid: episode.episodeGuid,
    episodeTitle: episode.trackName || "Untitled Episode",
  };
}

/**
 * Parse duration string (HH:MM:SS or MM:SS or seconds) to seconds
 */
function parseDuration(duration: string | undefined): number | undefined {
  if (!duration) return undefined;

  // If it's just a number, assume seconds
  if (/^\d+$/.test(duration)) {
    return parseInt(duration, 10);
  }

  // Parse HH:MM:SS or MM:SS
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return undefined;
}

/**
 * Extract text content from XML, handling CDATA
 */
function extractXmlContent(xml: string, tag: string): string | undefined {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, "i");
  const match = xml.match(regex);
  return match?.[1]?.trim();
}

/**
 * Fetch and parse RSS feed to find episode by GUID
 */
async function parseRssFeed(feedUrl: string, episodeGuid: string, podcastName: string): Promise<RSSEpisode> {
  const response = await fetch(feedUrl, {
    headers: {
      "User-Agent": "KindleCrafter/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.status}`);
  }

  const xmlText = await response.text();

  // Find all items and search for the one with matching GUID
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];

    // Extract the GUID from this item
    const guidMatch = itemXml.match(/<guid[^>]*>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/guid>/);
    const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/);

    // Match by GUID (exact match)
    if (guidMatch?.[1] === episodeGuid && enclosureMatch) {
      const title = extractXmlContent(itemXml, "title") || "Untitled Episode";
      const durationMatch = itemXml.match(/<itunes:duration>([^<]+)<\/itunes:duration>/);
      const pubDateMatch = itemXml.match(/<pubDate>([^<]+)<\/pubDate>/);
      const description = extractXmlContent(itemXml, "description");

      return {
        title,
        guid: guidMatch?.[1] || "",
        enclosureUrl: enclosureMatch[1],
        duration: durationMatch?.[1],
        pubDate: pubDateMatch?.[1],
        description,
        podcastName,
      };
    }
  }

  throw new Error("Episode not found in RSS feed. The episode may no longer be available.");
}

/**
 * Main function to extract audio URL and metadata from Apple Podcast URL
 */
export async function extractPodcastAudio(appleUrl: string): Promise<{
  audioUrl: string;
  metadata: PodcastMetadata;
}> {
  const { podcastId, episodeId } = parseApplePodcastUrl(appleUrl);

  console.log("[extractPodcastAudio] Looking up podcast:", podcastId, "episode:", episodeId);

  // Get the RSS GUID from iTunes API (Apple's episode ID doesn't match RSS GUID)
  const { episodeGuid, episodeTitle } = await getEpisodeGuidFromItunes(podcastId, episodeId);
  console.log("[extractPodcastAudio] Found episode GUID:", episodeGuid, "title:", episodeTitle);

  const { feedUrl, podcastName } = await getRssFeedUrl(podcastId);
  console.log("[extractPodcastAudio] Found RSS feed:", feedUrl);

  const episode = await parseRssFeed(feedUrl, episodeGuid, podcastName);
  console.log("[extractPodcastAudio] Found episode:", episode.title);

  return {
    audioUrl: episode.enclosureUrl,
    metadata: {
      title: episode.title,
      podcastName: episode.podcastName,
      durationSeconds: parseDuration(episode.duration),
      publishDate: episode.pubDate,
      description: episode.description,
      source: "apple" as SourceType,
    },
  };
}

/**
 * Detect the source type from a URL
 */
export function detectSourceType(url: string): SourceType | null {
  if (
    url.includes("podcasts.apple.com") ||
    url.includes("itunes.apple.com")
  ) {
    return "apple";
  }

  if (
    url.includes("youtube.com") ||
    url.includes("youtu.be")
  ) {
    return "youtube";
  }

  return null;
}

/**
 * Parse YouTube URL to extract video ID
 * Supports formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
export function parseYoutubeUrl(url: string): { videoId: string } {
  // Standard watch URL: youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) {
    return { videoId: watchMatch[1] };
  }

  // Short URL: youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) {
    return { videoId: shortMatch[1] };
  }

  // Embed URL: youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) {
    return { videoId: embedMatch[1] };
  }

  // Old v URL: youtube.com/v/VIDEO_ID
  const vMatch = url.match(/youtube\.com\/v\/([a-zA-Z0-9_-]{11})/);
  if (vMatch) {
    return { videoId: vMatch[1] };
  }

  // Shorts URL: youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) {
    return { videoId: shortsMatch[1] };
  }

  throw new Error(
    "Invalid YouTube URL format. Expected format: https://youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
  );
}

/**
 * Extract audio URL and metadata from YouTube video
 */
export async function extractYoutubeAudio(youtubeUrl: string): Promise<{
  audioUrl: string;
  metadata: PodcastMetadata;
}> {
  const { videoId } = parseYoutubeUrl(youtubeUrl);

  console.log("[extractYoutubeAudio] Getting info for video:", videoId);

  // Get video info using ytdl-core
  const info = await ytdl.getInfo(videoId);

  const title = info.videoDetails.title;
  const channelName = info.videoDetails.author.name;
  const durationSeconds = parseInt(info.videoDetails.lengthSeconds, 10);
  const publishDate = info.videoDetails.publishDate;
  const description = info.videoDetails.description || undefined;

  // Get the best audio format
  const audioFormats = ytdl.filterFormats(info.formats, "audioonly");

  if (audioFormats.length === 0) {
    throw new Error("No audio formats available for this video");
  }

  // Prefer formats with higher audio quality
  const sortedFormats = audioFormats.sort((a, b) => {
    const aBitrate = a.audioBitrate || 0;
    const bBitrate = b.audioBitrate || 0;
    return bBitrate - aBitrate;
  });

  const bestAudio = sortedFormats[0];

  if (!bestAudio.url) {
    throw new Error("Failed to get audio stream URL");
  }

  console.log("[extractYoutubeAudio] Found audio format:", bestAudio.mimeType, "bitrate:", bestAudio.audioBitrate);

  return {
    audioUrl: bestAudio.url,
    metadata: {
      title,
      podcastName: channelName,
      durationSeconds,
      publishDate,
      description,
      source: "youtube" as SourceType,
    },
  };
}

/**
 * Unified function to extract audio from either Apple Podcasts or YouTube
 */
export async function extractAudio(url: string): Promise<{
  audioUrl: string;
  metadata: PodcastMetadata;
}> {
  const sourceType = detectSourceType(url);

  if (sourceType === "apple") {
    return extractPodcastAudio(url);
  }

  if (sourceType === "youtube") {
    return extractYoutubeAudio(url);
  }

  throw new Error(
    "Unsupported URL format. Please provide an Apple Podcasts or YouTube URL."
  );
}

/**
 * Build the Gemini prompt for transcription + formatting
 */
function buildTranscriptionPrompt(metadata: PodcastMetadata): string {
  const sourceLabel = metadata.source === "youtube" ? "YouTube video" : "podcast episode";
  const channelLabel = metadata.source === "youtube" ? "Channel" : "Podcast";

  return `You are transcribing a ${sourceLabel} for reading on a Kindle e-reader.

CONTENT INFO:
- Title: ${metadata.title}
- ${channelLabel}: ${metadata.podcastName}
${metadata.publishDate ? `- Published: ${metadata.publishDate}` : ""}

TRANSCRIPTION REQUIREMENTS:

1. **Format as Markdown** suitable for book reading:
   - Start with a level 1 heading (# Title)
   - Add a brief intro paragraph with ${channelLabel.toLowerCase()} name and date if available

2. **Chapter/Section Headings**:
   - Automatically detect topic changes and insert level 2 headings (##)
   - Create meaningful section titles based on the content being discussed
   - Aim for 3-8 sections depending on episode length
   - Example: "## The Early Days of the Company" or "## Advice for Entrepreneurs"

3. **Speaker Identification**:
   - Identify speakers when their names are mentioned in the audio
   - Format speaker changes as **Speaker Name:** at the start of their speech
   - If names aren't mentioned, use "Host:" and "Guest:" or "Speaker 1:", "Speaker 2:"
   - Don't repeat the speaker label if the same person continues speaking

4. **Clean Paragraphs**:
   - Remove all filler words: "um", "uh", "like" (when used as filler), "you know", "I mean", "sort of", "kind of" (when not meaningful)
   - Remove false starts and repeated words
   - Break into logical paragraphs (4-6 sentences each)
   - Ensure proper punctuation and capitalization

5. **Do NOT include**:
   - Timestamps
   - [inaudible] markers (skip unclear parts smoothly)
   - Ads or sponsor reads (skip these sections entirely)
   - Excessive "laughs" or "sighs" annotations

6. **Maintain Natural Reading Flow**:
   - The output should read like a polished magazine interview or book chapter
   - Preserve the speaker's meaning and personality while cleaning up verbal tics

OUTPUT: Provide ONLY the formatted Markdown transcript. Do not include any meta-commentary about the transcription.`;
}

/**
 * Transcribe podcast audio using Gemini API
 */
export async function transcribePodcast(
  audioUrl: string,
  metadata: PodcastMetadata
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenAI({ apiKey });

  // Fetch audio file
  console.log("[transcribePodcast] Downloading audio from:", audioUrl);
  const audioResponse = await fetch(audioUrl, {
    headers: {
      "User-Agent": "KindleCrafter/1.0",
    },
  });

  if (!audioResponse.ok) {
    throw new Error(`Failed to download audio: ${audioResponse.status}`);
  }

  const audioBuffer = await audioResponse.arrayBuffer();
  const audioSize = audioBuffer.byteLength;
  console.log("[transcribePodcast] Audio size:", (audioSize / 1024 / 1024).toFixed(2), "MB");

  // Determine MIME type from Content-Type header or URL
  const contentType = audioResponse.headers.get("content-type") || "audio/mpeg";
  const mimeType = contentType.split(";")[0].trim();

  // Build transcription prompt
  const prompt = buildTranscriptionPrompt(metadata);

  console.log("[transcribePodcast] Sending to Gemini for transcription...");

  let result;

  // For files > 20MB, use Files API upload
  if (audioSize > 20 * 1024 * 1024) {
    console.log("[transcribePodcast] Large file, using Files API upload...");

    const uploadResult = await genAI.files.upload({
      file: new Blob([audioBuffer], { type: mimeType }),
      config: { mimeType },
    });

    // Wait for processing
    let file = uploadResult;
    while (file.state === "PROCESSING") {
      console.log("[transcribePodcast] Waiting for file processing...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      file = await genAI.files.get({ name: file.name! });
    }

    if (file.state === "FAILED") {
      throw new Error("File processing failed");
    }

    result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                fileUri: file.uri!,
                mimeType,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    // Clean up uploaded file
    try {
      await genAI.files.delete({ name: file.name! });
    } catch {
      // Ignore cleanup errors
    }
  } else {
    // For smaller files, use inline base64
    const audioBase64 = Buffer.from(audioBuffer).toString("base64");

    result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: audioBase64,
                mimeType,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });
  }

  const transcript = result.text;

  if (!transcript || transcript.length < 100) {
    throw new Error("Transcription returned empty or too short result");
  }

  console.log("[transcribePodcast] Transcription complete, length:", transcript.length);

  return transcript;
}

/**
 * Check if Gemini API key is configured
 */
export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
