import { RecipeForm } from "@/components/recipe-form";
import { checkMagazinesConfigured } from "@/app/actions/magazines";
import Link from "next/link";

export default async function NewRecipePage() {
  const config = await checkMagazinesConfigured();
  const configComplete = config.kindleEmail && config.emailService && config.modal;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add Recipe</h1>
        <p className="text-muted-foreground mt-1">
          Upload a Calibre recipe to receive magazines on your Kindle.
        </p>
      </div>

      {!config.kindleEmail && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <Link href="/settings" className="underline font-medium">
              Configure your Kindle email
            </Link>{" "}
            before adding recipes.
          </p>
        </div>
      )}

      <RecipeForm configComplete={configComplete} />
    </div>
  );
}
