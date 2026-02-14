import { inngest } from "@/lib/inngest";
import { extractSource, transcribePodcast, reformatCaptions } from "@/lib/podcast";
import { parseMarkdown, removeFirstH1IfMatchesTitle } from "@/lib/markdown";
import { generateEpub } from "@/lib/epub";
import { sendToKindle } from "@/lib/email";

interface TranscribePodcastEvent {
  name: "podcast/transcribe.requested";
  data: {
    podcastUrl: string;
    kindleEmail: string;
  };
}

export const transcribePodcastJob = inngest.createFunction(
  {
    id: "transcribe-podcast",
    retries: 2,
  },
  { event: "podcast/transcribe.requested" },
  async ({ event, step }) => {
    const { podcastUrl, kindleEmail } = event.data as TranscribePodcastEvent["data"];

    // Step 1: Extract source (audio URL for Apple, captions for YouTube)
    const extractionResult = await step.run("extract-source", async () => {
      console.log("[transcribePodcastJob] Extracting source from:", podcastUrl);
      return extractSource(podcastUrl);
    });

    // Step 2: Transcribe/reformat based on source type
    const markdown = await step.run("transcribe", async () => {
      if (extractionResult.source === "youtube") {
        console.log("[transcribePodcastJob] Reformatting YouTube captions:", extractionResult.metadata.title);
        return reformatCaptions(extractionResult.captionText, extractionResult.metadata);
      } else {
        console.log("[transcribePodcastJob] Transcribing audio:", extractionResult.metadata.title);
        return transcribePodcast(extractionResult.audioUrl, extractionResult.metadata);
      }
    });

    const metadata = extractionResult.metadata;

    // Step 3: Convert to EPUB
    const epubBase64 = await step.run("generate-epub", async () => {
      console.log("[transcribePodcastJob] Generating EPUB");
      // Remove first H1 if it matches the title to avoid duplication on Kindle
      const processedMarkdown = removeFirstH1IfMatchesTitle(markdown, metadata.title);
      const html = await parseMarkdown(processedMarkdown);
      const epubBuffer = await generateEpub({
        title: metadata.title,
        author: metadata.podcastName,
        html,
      });
      return epubBuffer.toString("base64");
    });

    // Step 4: Send to Kindle
    await step.run("send-to-kindle", async () => {
      console.log("[transcribePodcastJob] Sending to Kindle:", kindleEmail);
      const epubBuffer = Buffer.from(epubBase64, "base64");
      await sendToKindle({
        to: kindleEmail,
        title: metadata.title,
        epubBuffer,
      });
    });

    console.log("[transcribePodcastJob] Complete:", metadata.title);

    return {
      success: true,
      title: metadata.title,
      podcastName: metadata.podcastName,
    };
  }
);
