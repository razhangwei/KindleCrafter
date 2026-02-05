import { notFound } from "next/navigation";
import { RecipeForm } from "@/components/recipe-form";
import { getRecipe, checkMagazinesConfigured } from "@/app/actions/magazines";

interface EditRecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = await params;
  const [recipeData, config] = await Promise.all([
    getRecipe(id),
    checkMagazinesConfigured(),
  ]);

  if (!recipeData) {
    notFound();
  }

  const configComplete = config.kindleEmail && config.emailService && config.modal;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Recipe</h1>
        <p className="text-muted-foreground mt-1">
          Update settings for &ldquo;{recipeData.recipe.name}&rdquo;.
        </p>
      </div>

      <RecipeForm existingRecipe={recipeData} configComplete={configComplete} />
    </div>
  );
}
