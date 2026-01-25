import { PodcastForm } from "@/components/podcast-form";
import { checkPodcastConfigured } from "@/app/actions/podcast";
import Link from "next/link";

export default async function PodcastPage() {
  const config = await checkPodcastConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Podcast to Kindle</h1>
        <p className="text-muted-foreground mt-1">
          Transcribe a podcast episode and send it to your Kindle.
        </p>
      </div>

      {!config.kindleEmail && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <Link href="/settings" className="underline font-medium">
              Configure your Kindle email
            </Link>{" "}
            to enable sending transcripts to your device.
          </p>
        </div>
      )}

      <PodcastForm
        kindleEmailConfigured={config.kindleEmail}
        emailServiceConfigured={config.emailService}
        geminiConfigured={config.gemini}
      />
    </div>
  );
}
