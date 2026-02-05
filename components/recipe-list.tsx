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

function formatNextRun(date: Date | null): string {
  if (!date) return "Not scheduled";

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  if (diffMs < 0) return "Due now";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `in ${diffDays} day${diffDays > 1 ? "s" : ""}`;
  }
  if (diffHours > 0) {
    return `in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
  }

  const diffMins = Math.floor(diffMs / (1000 * 60));
  return `in ${diffMins} minute${diffMins !== 1 ? "s" : ""}`;
}

function formatLastRun(date: Date | null, status: string | null): string {
  if (!date) return "Never run";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  let timeAgo: string;
  if (diffDays > 0) {
    timeAgo = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else if (diffHours > 0) {
    timeAgo = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    timeAgo = `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  }

  const statusEmoji = status === "success" ? "✓" : status === "failed" ? "✗" : "";
  return `${statusEmoji} ${timeAgo}`;
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
                      Next run: {formatNextRun(schedule?.nextRunAt ?? null)}
                      {schedule?.lastRunAt && (
                        <> • Last: {formatLastRun(schedule.lastRunAt, schedule.lastRunStatus)}</>
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
