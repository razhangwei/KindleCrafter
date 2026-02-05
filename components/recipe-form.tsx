"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { createRecipe, updateRecipe, type RecipeWithSchedule } from "@/app/actions/magazines";

// Days of the week (cron uses 0=Sunday, 1=Monday, etc.)
const DAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
] as const;

// Common timezones
const TIMEZONES = [
  { label: "UTC", value: "UTC" },
  { label: "US Eastern", value: "America/New_York" },
  { label: "US Pacific", value: "America/Los_Angeles" },
  { label: "US Central", value: "America/Chicago" },
  { label: "UK", value: "Europe/London" },
  { label: "Central Europe", value: "Europe/Berlin" },
  { label: "Japan", value: "Asia/Tokyo" },
  { label: "China", value: "Asia/Shanghai" },
  { label: "India", value: "Asia/Kolkata" },
  { label: "Australia Eastern", value: "Australia/Sydney" },
] as const;

// Parse a cron expression to extract hour and days
function parseCronExpression(cron: string): { hour: number; days: number[] } {
  const parts = cron.split(" ");
  // Format: minute hour day-of-month month day-of-week
  // e.g., "0 6 * * 1,2,3" = 6 AM on Mon, Tue, Wed

  const hour = parseInt(parts[1], 10) || 6;

  const dayPart = parts[4];
  let days: number[];

  if (dayPart === "*") {
    // Every day
    days = [0, 1, 2, 3, 4, 5, 6];
  } else if (dayPart === "1-5") {
    // Weekdays shorthand
    days = [1, 2, 3, 4, 5];
  } else if (dayPart === "0,6") {
    // Weekends shorthand
    days = [0, 6];
  } else {
    // Parse comma-separated list
    days = dayPart.split(",").map((d) => parseInt(d, 10)).filter((d) => !isNaN(d));
  }

  return { hour, days };
}

// Build a cron expression from hour and days
function buildCronExpression(hour: number, days: number[]): string {
  if (days.length === 0) {
    // Default to daily if no days selected
    return `0 ${hour} * * *`;
  }

  if (days.length === 7) {
    // Every day
    return `0 ${hour} * * *`;
  }

  // Sort days and join with commas
  const sortedDays = [...days].sort((a, b) => a - b);
  return `0 ${hour} * * ${sortedDays.join(",")}`;
}

interface RecipeFormProps {
  existingRecipe?: RecipeWithSchedule;
  configComplete: boolean;
}

export function RecipeForm({ existingRecipe, configComplete }: RecipeFormProps) {
  const router = useRouter();
  const isEditing = !!existingRecipe;

  const [name, setName] = useState(existingRecipe?.recipe.name ?? "");
  const [recipeFile, setRecipeFile] = useState<File | null>(null);
  const [timezone, setTimezone] = useState(
    existingRecipe?.schedule?.timezone ?? "UTC"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Schedule state
  const initialSchedule = parseCronExpression(
    existingRecipe?.schedule?.cronExpression ?? "0 6 * * *"
  );
  const [selectedHour, setSelectedHour] = useState(initialSchedule.hour);
  const [selectedDays, setSelectedDays] = useState<number[]>(initialSchedule.days);

  // Sync cron expression when schedule changes
  const cronExpression = buildCronExpression(selectedHour, selectedDays);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".recipe")) {
        toast.error("Please upload a .recipe file");
        e.target.value = "";
        return;
      }
      setRecipeFile(file);

      if (!name) {
        setName(file.name.replace(".recipe", ""));
      }
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const selectAllDays = () => setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  const selectWeekdays = () => setSelectedDays([1, 2, 3, 4, 5]);
  const selectWeekends = () => setSelectedDays([0, 6]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a recipe name");
      return;
    }

    if (!isEditing && !recipeFile) {
      toast.error("Please upload a recipe file");
      return;
    }

    if (selectedDays.length === 0) {
      toast.error("Please select at least one delivery day");
      return;
    }

    setIsSubmitting(true);

    try {
      let recipeContent: string | undefined;

      if (recipeFile) {
        const buffer = await recipeFile.arrayBuffer();
        recipeContent = Buffer.from(buffer).toString("base64");
      }

      if (isEditing) {
        const result = await updateRecipe({
          id: existingRecipe.recipe.id,
          name: name.trim(),
          recipeContent,
          cronExpression,
          timezone,
        });

        if (result.success) {
          toast.success("Recipe updated successfully");
          router.push("/magazines");
        } else {
          toast.error(result.error || "Failed to update recipe");
        }
      } else {
        if (!recipeContent) {
          toast.error("Recipe file is required");
          return;
        }

        const result = await createRecipe({
          name: name.trim(),
          recipeContent,
          cronExpression,
          timezone,
        });

        if (result.success) {
          toast.success("Recipe created successfully");
          router.push("/magazines");
        } else {
          toast.error(result.error || "Failed to create recipe");
        }
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format hour for display
  const formatHour = (hour: number): string => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Recipe" : "Add New Recipe"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Update your magazine recipe settings."
            : "Upload a Calibre recipe file to automatically receive magazines on your Kindle."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipe Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Recipe Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., The Economist, BBC News"
              disabled={isSubmitting}
            />
          </div>

          {/* Recipe File */}
          <div className="space-y-2">
            <Label htmlFor="recipe-file">
              Recipe File (.recipe)
              {isEditing && " (leave empty to keep current)"}
            </Label>
            <Input
              id="recipe-file"
              type="file"
              accept=".recipe"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
            <p className="text-sm text-muted-foreground">
              Download recipes from{" "}
              <a
                href="https://github.com/kovidgoyal/calibre/tree/master/recipes"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Calibre&apos;s recipe repository
              </a>
              .
            </p>
          </div>

          {/* Delivery Days */}
          <div className="space-y-3">
            <Label>Delivery Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  disabled={isSubmitting}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${
                    selectedDays.includes(day.value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-accent"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllDays}
                className="text-muted-foreground hover:text-foreground underline"
                disabled={isSubmitting}
              >
                Every day
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                onClick={selectWeekdays}
                className="text-muted-foreground hover:text-foreground underline"
                disabled={isSubmitting}
              >
                Weekdays
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                onClick={selectWeekends}
                className="text-muted-foreground hover:text-foreground underline"
                disabled={isSubmitting}
              >
                Weekends
              </button>
            </div>
          </div>

          {/* Delivery Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Delivery Time</Label>
            <select
              id="time"
              value={selectedHour}
              onChange={(e) => setSelectedHour(parseInt(e.target.value, 10))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isSubmitting}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {formatHour(i)}
                </option>
              ))}
            </select>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isSubmitting}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Schedule Preview */}
          <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            Delivers at <strong>{formatHour(selectedHour)}</strong> ({timezone}) on{" "}
            <strong>
              {selectedDays.length === 7
                ? "every day"
                : selectedDays.length === 0
                ? "no days selected"
                : selectedDays
                    .sort((a, b) => a - b)
                    .map((d) => DAYS.find((day) => day.value === d)?.label)
                    .join(", ")}
            </strong>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting || (!isEditing && !configComplete)}>
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                ? "Save Changes"
                : "Add Recipe"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/magazines")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>

          {!configComplete && !isEditing && (
            <p className="text-sm text-muted-foreground">
              Configure your Kindle email and Modal settings before adding recipes.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
