"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { runRecipeNow, toggleRecipeEnabled, deleteRecipe, type RecipeWithSchedule } from "@/app/actions/magazines";

interface RecipeListProps {
  recipes: RecipeWithSchedule[];
  configComplete: boolean;
}

// Days of the week for display
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Format hour for display (e.g., "6 AM", "6 PM")
function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

// Parse cron expression and format as human-readable schedule
function formatSchedule(cronExpression: string | undefined, timezone: string | undefined): string {
  if (!cronExpression) return "No schedule";

  const parts = cronExpression.split(" ");
  // Format: minute hour day-of-month month day-of-week
  const hour = parseInt(parts[1], 10) || 0;
  const dayPart = parts[4];

  const timeStr = formatHour(hour);
  const tzShort = timezone ? `(${timezone.split("/").pop()?.replace("_", " ")})` : "";

  // Parse days
  let daysStr: string;
  if (dayPart === "*") {
    daysStr = "Daily";
  } else if (dayPart === "1-5") {
    daysStr = "Weekdays";
  } else if (dayPart === "0,6" || dayPart === "6,0") {
    daysStr = "Weekends";
  } else {
    // Parse comma-separated list
    const days = dayPart.split(",").map((d) => parseInt(d, 10)).filter((d) => !isNaN(d));
    if (days.length === 7) {
      daysStr = "Daily";
    } else if (days.length === 1) {
      daysStr = `${DAYS[days[0]]}s`; // e.g., "Sundays"
    } else {
      daysStr = days.map((d) => DAYS[d]).join(", ");
    }
  }

  return `${daysStr} at ${timeStr} ${tzShort}`.trim();
}

// Format last run time as relative time
function formatLastRun(date: Date | null, status: string | null): string {
  if (!date) return "Never run";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  let timeAgo: string;
  if (diffDays > 0) {
    timeAgo = `${diffDays}d ago`;
  } else if (diffHours > 0) {
    timeAgo = `${diffHours}h ago`;
  } else {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    timeAgo = diffMins < 1 ? "just now" : `${diffMins}m ago`;
  }

  const statusIcon = status === "success" ? "✓" : status === "failed" ? "✗" : "";
  return `${statusIcon} ${timeAgo}`.trim();
}

export function RecipeList({ recipes, configComplete }: RecipeListProps) {
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleRunNow = async (recipeId: string, recipeName: string) => {
    setRunningIds((prev) => new Set(prev).add(recipeId));

    try {
      const result = await runRecipeNow(recipeId);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(`Failed to run ${recipeName}`);
    } finally {
      setRunningIds((prev) => {
        const next = new Set(prev);
        next.delete(recipeId);
        return next;
      });
    }
  };

  const handleToggle = async (recipeId: string, currentEnabled: boolean) => {
    try {
      const result = await toggleRecipeEnabled(recipeId, !currentEnabled);

      if (result.success) {
        toast.success(currentEnabled ? "Recipe paused" : "Recipe enabled");
      } else {
        toast.error(result.error || "Failed to toggle recipe");
      }
    } catch {
      toast.error("Failed to toggle recipe");
    }
  };

  const handleDelete = async (recipeId: string, recipeName: string) => {
    if (!confirm(`Delete "${recipeName}"? This cannot be undone.`)) {
      return;
    }

    setDeletingIds((prev) => new Set(prev).add(recipeId));

    try {
      const result = await deleteRecipe(recipeId);

      if (result.success) {
        toast.success(`Deleted "${recipeName}"`);
      } else {
        toast.error(result.error || "Failed to delete recipe");
      }
    } catch {
      toast.error("Failed to delete recipe");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(recipeId);
        return next;
      });
    }
  };

  if (recipes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            No magazine recipes configured yet.
          </p>
          <Link href="/magazines/new">
            <Button>Add Your First Recipe</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {recipes.map(({ recipe, schedule }) => (
        <Card key={recipe.id} className={!recipe.enabled ? "opacity-60" : ""}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{recipe.name}</CardTitle>
                <CardDescription className="mt-1">
                  {recipe.enabled ? (
                    <>
                      {formatSchedule(schedule?.cronExpression, schedule?.timezone)}
                      {schedule?.lastRunAt && (
                        <> · Last: {formatLastRun(schedule.lastRunAt, schedule.lastRunStatus)}</>
                      )}
                    </>
                  ) : (
                    "Paused"
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggle(recipe.id, recipe.enabled)}
                >
                  {recipe.enabled ? "Pause" : "Enable"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => handleRunNow(recipe.id, recipe.name)}
                disabled={runningIds.has(recipe.id) || !configComplete}
              >
                {runningIds.has(recipe.id) ? "Starting..." : "Run Now"}
              </Button>
              <Link href={`/magazines/${recipe.id}`}>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleDelete(recipe.id, recipe.name)}
                disabled={deletingIds.has(recipe.id)}
              >
                {deletingIds.has(recipe.id) ? "Deleting..." : "Delete"}
              </Button>
            </div>
            {schedule?.lastRunError && (
              <p className="mt-2 text-sm text-destructive">
                Last error: {schedule.lastRunError}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
