"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { updateSettings } from "@/app/actions/settings";
import { toast } from "sonner";

interface SettingsFormProps {
  initialEmail: string;
}

export function SettingsForm({ initialEmail }: SettingsFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.includes("@kindle.com")) {
      toast.error("Please enter a valid Kindle email (e.g., yourname@kindle.com)");
      return;
    }

    setIsLoading(true);
    try {
      await updateSettings(email);
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kindle Settings</CardTitle>
        <CardDescription>
          Configure your Kindle email to enable sending EPUBs directly to your device.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kindle-email">Kindle Email</Label>
            <Input
              id="kindle-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@kindle.com"
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              Find this in your Amazon account under &quot;Send to Kindle Email&quot;
            </p>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
