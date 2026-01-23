import { ConversionForm } from "@/components/conversion-form";
import { getSettings } from "@/app/actions/settings";
import { checkEmailConfigured } from "@/app/actions/convert";
import Link from "next/link";

export default async function HomePage() {
  const settings = await getSettings();
  const emailConfigured = await checkEmailConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Convert Markdown to EPUB</h1>
        <p className="text-muted-foreground mt-1">
          Upload a Markdown file, convert it to EPUB, and send it to your Kindle.
        </p>
      </div>

      {!settings?.kindleEmail && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <Link href="/settings" className="underline font-medium">
              Configure your Kindle email
            </Link>{" "}
            to enable sending EPUBs directly to your device.
          </p>
        </div>
      )}

      <ConversionForm
        kindleEmailConfigured={!!settings?.kindleEmail}
        emailServiceConfigured={emailConfigured}
      />
    </div>
  );
}
