"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { submitPodcastJob } from "@/app/actions/podcast";
import { toast } from "sonner";

interface PodcastFormProps {
  kindleEmailConfigured: boolean;
  emailServiceConfigured: boolean;
  geminiConfigured: boolean;
}

export function PodcastForm({
  kindleEmailConfigured,
  emailServiceConfigured,
  geminiConfigured,
}: PodcastFormProps) {
  const [url, setUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validateApplePodcastUrl = (url: string): boolean => {
    const pattern = /^https:\/\/podcasts\.apple\.com\/.+\/id\d+.*[?&]i=\d+/;
    return pattern.test(url);
  };

  const handleSubmit = async () => {
    if (!url.trim()) {
      toast.error("Please enter a podcast URL");
      return;
    }

    if (!validateApplePodcastUrl(url)) {
      toast.error("Please enter a valid Apple Podcast episode URL");
      return;
    }

    setIsLoading(true);

    try {
      const result = await submitPodcastJob(url);

      if (result.success) {
        toast.success(result.message);
        setSubmitted(true);
        setUrl("");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to submit podcast for processing");
    } finally {
      setIsLoading(false);
    }
  };

  const allConfigured = kindleEmailConfigured && emailServiceConfigured && geminiConfigured;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcribe Podcast Episode</CardTitle>
        <CardDescription>
          Paste an Apple Podcast episode URL to transcribe and send to your Kindle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="podcast-url">Apple Podcast Episode URL</Label>
          <Input
            id="podcast-url"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setSubmitted(false);
            }}
            placeholder="https://podcasts.apple.com/.../id123456789?i=1000123456789"
            disabled={isLoading}
          />
          <p className="text-sm text-muted-foreground">
            Episodes up to 1 hour are supported. Processing takes 2-4 minutes.
          </p>
        </div>

        {submitted && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
            <p className="text-sm text-green-800 dark:text-green-200">
              Your podcast is being transcribed! Check your Kindle in a few minutes.
            </p>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isLoading || !url.trim() || !allConfigured}
          className="w-full"
        >
          {isLoading ? "Submitting..." : "Send to Kindle"}
        </Button>

        {!allConfigured && (
          <div className="text-sm text-muted-foreground text-center space-y-1">
            {!kindleEmailConfigured && (
              <p>Configure your Kindle email in Settings to enable sending.</p>
            )}
            {!emailServiceConfigured && (
              <p>Email service not configured (RESEND_API_KEY or Gmail).</p>
            )}
            {!geminiConfigured && (
              <p>Gemini API not configured (GEMINI_API_KEY).</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
