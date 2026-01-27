import { inngest } from "@/lib/inngest";
import { extractPodcastAudio, transcribePodcast } from "@/lib/podcast";
import { parseMarkdown } from "@/lib/markdown";
import { generateEpub } from "@/lib/epub";
import { sendToKindle } from "@/lib/email";

interface TranscribePodcastEvent {
  name: "podcast/transcribe.requested";
  data: {
    podcastUrl: string;
    userId: string;
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

    // Step 1: Extract audio URL from Apple Podcast
    const { audioUrl, metadata } = await step.run("extract-audio", async () => {
      console.log("[transcribePodcastJob] Extracting audio from:", podcastUrl);
      return extractPodcastAudio(podcastUrl);
    });

    // Step 2: Transcribe with Gemini
    const markdown = await step.run("transcribe", async () => {
      console.log("[transcribePodcastJob] Transcribing:", metadata.title);
      return transcribePodcast(audioUrl, metadata);
    });

    // Step 3: Convert to EPUB
    const epubBase64 = await step.run("generate-epub", async () => {
      console.log("[transcribePodcastJob] Generating EPUB");
      const html = await parseMarkdown(markdown);
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
