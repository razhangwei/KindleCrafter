"use server";

import { parseMarkdown, extractTitleFromFilename, removeFirstH1IfMatchesTitle } from "@/lib/markdown";
import { generateEpub } from "@/lib/epub";
import { sendToKindle, isEmailConfigured } from "@/lib/email";
import { getSettings } from "./settings";

interface ConvertInput {
  markdown: string;
  filename: string;
  title?: string;
  author?: string;
}

interface ConvertResult {
  success: boolean;
  message: string;
  epubBase64?: string;
  filename?: string;
}

export async function convertToEpub(input: ConvertInput): Promise<ConvertResult> {
  try {
    const title = input.title || extractTitleFromFilename(input.filename);
    const author = input.author || "KindleCrafter";

    console.log("[convertToEpub] Starting conversion for:", title);

    // Remove first H1 if it matches the title to avoid duplication on Kindle
    const processedMarkdown = removeFirstH1IfMatchesTitle(input.markdown, title);

    let html: string;
    try {
      html = await parseMarkdown(processedMarkdown);
      console.log("[convertToEpub] Markdown parsed successfully");
    } catch (parseError) {
      console.error("[convertToEpub] Markdown parsing failed:", parseError);
      throw new Error(`Markdown parsing failed: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
    }

    let epubBuffer: Buffer;
    try {
      epubBuffer = await generateEpub({ title, author, html });
      console.log("[convertToEpub] EPUB generated successfully, size:", epubBuffer.length);
    } catch (epubError) {
      console.error("[convertToEpub] EPUB generation failed:", epubError);
      throw new Error(`EPUB generation failed: ${epubError instanceof Error ? epubError.message : "Unknown error"}`);
    }

    const sanitizedTitle = title.replace(/[\\/:*?"<>|]/g, "_");

    return {
      success: true,
      message: `EPUB generated successfully`,
      epubBase64: epubBuffer.toString("base64"),
      filename: `${sanitizedTitle}.epub`,
    };
  } catch (error) {
    console.error("[convertToEpub] Error:", error);
    return {
      success: false,
      message: `Failed to generate EPUB: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function convertAndSend(input: ConvertInput): Promise<ConvertResult> {
  const userSettings = await getSettings();

  if (!userSettings?.kindleEmail) {
    return { success: false, message: "Please configure your Kindle email first" };
  }

  if (!isEmailConfigured()) {
    return { success: false, message: "Email sending is not configured. Please set RESEND_API_KEY and SENDER_EMAIL." };
  }

  try {
    const title = input.title || extractTitleFromFilename(input.filename);
    const author = input.author || "KindleCrafter";

    // Remove first H1 if it matches the title to avoid duplication on Kindle
    const processedMarkdown = removeFirstH1IfMatchesTitle(input.markdown, title);

    const html = await parseMarkdown(processedMarkdown);
    const epubBuffer = await generateEpub({ title, author, html });

    await sendToKindle({
      to: userSettings.kindleEmail,
      title,
      epubBuffer,
    });

    return {
      success: true,
      message: `"${title}" sent to your Kindle!`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to send: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export async function checkEmailConfigured(): Promise<boolean> {
  return isEmailConfigured();
}
