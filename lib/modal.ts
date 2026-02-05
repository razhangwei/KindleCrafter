/**
 * Modal.com HTTP client for executing Calibre recipes
 *
 * This client calls a Modal serverless function that runs Calibre's ebook-convert
 * command to download and convert magazine content into EPUB format.
 */

interface ConvertRecipeRequest {
  recipeContent: string; // Base64 encoded .recipe file
  recipeName: string; // Used for logging/error messages
}

interface ConvertRecipeResponse {
  success: boolean;
  epubBase64?: string; // Base64 encoded EPUB file
  error?: string;
  executionTimeMs?: number;
}

/**
 * Check if Modal is configured
 */
export function isModalConfigured(): boolean {
  return !!(process.env.MODAL_ENDPOINT_URL && process.env.MODAL_WEBHOOK_SECRET);
}

/**
 * Execute a Calibre recipe via Modal and return the generated EPUB
 */
export async function executeRecipe(
  request: ConvertRecipeRequest
): Promise<ConvertRecipeResponse> {
  const endpointUrl = process.env.MODAL_ENDPOINT_URL;
  const webhookSecret = process.env.MODAL_WEBHOOK_SECRET;

  if (!endpointUrl || !webhookSecret) {
    return {
      success: false,
      error: "Modal is not configured. Set MODAL_ENDPOINT_URL and MODAL_WEBHOOK_SECRET.",
    };
  }

  try {
    console.log(`[Modal] Executing recipe: ${request.recipeName}`);
    const startTime = Date.now();

    const response = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": webhookSecret,
      },
      body: JSON.stringify({
        recipe_content: request.recipeContent,
        recipe_name: request.recipeName,
      }),
    });

    const executionTimeMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Modal] Request failed: ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `Modal request failed: ${response.status} - ${errorText}`,
        executionTimeMs,
      };
    }

    const data = await response.json();

    if (!data.success) {
      console.error(`[Modal] Recipe execution failed: ${data.error}`);
      return {
        success: false,
        error: data.error || "Unknown error from Modal",
        executionTimeMs,
      };
    }

    console.log(`[Modal] Recipe executed successfully in ${executionTimeMs}ms`);

    return {
      success: true,
      epubBase64: data.epub_base64,
      executionTimeMs,
    };
  } catch (error) {
    console.error("[Modal] Request error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
