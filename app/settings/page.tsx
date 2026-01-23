import { SettingsForm } from "@/components/settings-form";
import { getSettings } from "@/app/actions/settings";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your Kindle email and preferences.
        </p>
      </div>

      <SettingsForm initialEmail={settings?.kindleEmail || ""} />

      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="font-medium">How to find your Kindle email</h3>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
          <li>Go to Amazon.com and sign in</li>
          <li>Navigate to &quot;Manage Your Content and Devices&quot;</li>
          <li>Click on &quot;Preferences&quot; tab</li>
          <li>Scroll to &quot;Personal Document Settings&quot;</li>
          <li>Find your Kindle email (ends with @kindle.com)</li>
        </ol>
      </div>
    </div>
  );
}
