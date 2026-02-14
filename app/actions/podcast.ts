"use server";

import { inngest } from "@/lib/inngest";
import { parseApplePodcastUrl, detectSourceType, parseYoutubeUrl, extractSource, isGeminiConfigured } from "@/lib/podcast";
import { isEmailConfigured } from "@/lib/email";
import { getSettings } from "./settings";

const MAX_DURATION_SECONDS = 3600; // 1 hour limit

interface SubmitResult {
  success: boolean;
  message: string;
}

/**
 * Validate podcast/video URL format (Apple Podcasts or YouTube)
 */
function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const source = detectSourceType(url);
    if (source === "apple") {
      parseApplePodcastUrl(url);
    } else {
      parseYoutubeUrl(url);
    }
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Invalid URL format",
    };
  }
}

/**
 * Submit a podcast transcription job
 */
export async function submitPodcastJob(url: string): Promise<SubmitResult> {
  // Check Kindle email configuration
  const settings = await getSettings();
  if (!settings?.kindleEmail) {
    return {
      success: false,
      message: "Please configure your Kindle email in Settings first.",
    };
  }

  // Check email service configuration
  if (!isEmailConfigured()) {
    return {
      success: false,
      message: "Email service is not configured. Please set up RESEND_API_KEY or Gmail credentials.",
    };
  }

  // Check Gemini API key
  if (!isGeminiConfigured()) {
    return {
      success: false,
      message: "Gemini API is not configured. Please set GEMINI_API_KEY.",
    };
  }

  // Validate URL format
  const urlValidation = validateUrl(url);
  if (!urlValidation.valid) {
    return {
      success: false,
      message: urlValidation.error || "Invalid URL",
    };
  }

  // Pre-flight: extract source to validate captions/metadata and check duration
  try {
    const result = await extractSource(url);

    if (result.metadata.durationSeconds && result.metadata.durationSeconds > MAX_DURATION_SECONDS) {
      const minutes = Math.round(result.metadata.durationSeconds / 60);
      return {
        success: false,
        message: `Episode is too long (${minutes} minutes). Maximum supported duration is 60 minutes.`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to fetch source: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }

  // Queue the background job
  try {
    await inngest.send({
      name: "podcast/transcribe.requested",
      data: {
        podcastUrl: url,
        kindleEmail: settings.kindleEmail,
      },
    });

    return {
      success: true,
      message: "Processing started! You'll receive the transcript on your Kindle in a few minutes.",
    };
  } catch (error) {
    console.error("[submitPodcastJob] Failed to queue job:", error);
    return {
      success: false,
      message: `Failed to start processing: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Check if all required services are configured for podcast transcription
 */
export async function checkPodcastConfigured(): Promise<{
  kindleEmail: boolean;
  emailService: boolean;
  gemini: boolean;
}> {
  const settings = await getSettings();

  return {
    kindleEmail: !!settings?.kindleEmail,
    emailService: isEmailConfigured(),
    gemini: isGeminiConfigured(),
  };
}
