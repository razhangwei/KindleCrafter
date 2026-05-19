"use server";

import { get } from "@vercel/edge-config";
import { revalidatePath } from "next/cache";

export async function getSettings() {
  if (!process.env.EDGE_CONFIG) {
    return null;
  }

  try {
    const kindleEmail = await get<string>("kindleEmail");
    if (!kindleEmail) return null;
    return { kindleEmail };
  } catch {
    return null;
  }
}

type UpdateResult = { success: true } | { success: false; error: string };

export async function updateSettings(kindleEmail: string): Promise<UpdateResult> {
  const { VERCEL_API_TOKEN, EDGE_CONFIG_ID, VERCEL_TEAM_ID } = process.env;

  if (!VERCEL_API_TOKEN || !EDGE_CONFIG_ID) {
    return {
      success: false,
      error:
        "Edge Config write credentials missing. Set VERCEL_API_TOKEN and EDGE_CONFIG_ID in Vercel project env vars.",
    };
  }

  const url = new URL(
    `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`
  );
  if (VERCEL_TEAM_ID) url.searchParams.set("teamId", VERCEL_TEAM_ID);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          { operation: "upsert", key: "kindleEmail", value: kindleEmail },
        ],
      }),
    });
  } catch (err) {
    return {
      success: false,
      error: `Network error calling Vercel API: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return {
      success: false,
      error: `Vercel API ${res.status}: ${detail || res.statusText}`,
    };
  }

  revalidatePath("/");
  revalidatePath("/settings");

  return { success: true };
}
