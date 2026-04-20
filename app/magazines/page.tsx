import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RecipeList } from "@/components/recipe-list";
import { getRecipes, checkMagazinesConfigured } from "@/app/actions/magazines";

export default async function MagazinesPage() {
  const [recipes, config] = await Promise.all([
    getRecipes(),
    checkMagazinesConfigured(),
  ]);

  const configComplete = config.kindleEmail && config.emailService && config.modal;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Magazine Subscriptions</h1>
          <p className="text-muted-foreground mt-1">
            Automatically deliver magazines to your Kindle.
          </p>
        </div>
        <Link href="/magazines/new">
          <Button>Add Recipe</Button>
        </Link>
      </div>

      {!config.kindleEmail && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <Link href="/settings" className="underline font-medium">
              Configure your Kindle email
            </Link>{" "}
            to enable magazine delivery.
          </p>
        </div>
      )}

      {!config.modal && config.kindleEmail && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Modal is not configured. Set <code className="font-mono bg-yellow-100 dark:bg-yellow-900 px-1 rounded">MODAL_ENDPOINT_URL</code> and{" "}
            <code className="font-mono bg-yellow-100 dark:bg-yellow-900 px-1 rounded">MODAL_WEBHOOK_SECRET</code> in your environment.
          </p>
        </div>
      )}

      <RecipeList recipes={recipes} configComplete={configComplete} />
    </div>
  );
}
