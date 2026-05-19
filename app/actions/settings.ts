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

export async function updateSettings(kindleEmail: string) {
  const { VERCEL_API_TOKEN, EDGE_CONFIG_ID, VERCEL_TEAM_ID } = process.env;

  if (!VERCEL_API_TOKEN || !EDGE_CONFIG_ID) {
    throw new Error(
      "Edge Config write credentials not set. Please configure VERCEL_API_TOKEN and EDGE_CONFIG_ID."
    );
  }

  const url = new URL(
    `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`
  );
  if (VERCEL_TEAM_ID) url.searchParams.set("teamId", VERCEL_TEAM_ID);

  const res = await fetch(url, {
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

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Failed to update Edge Config (${res.status}): ${detail}`);
  }

  revalidatePath("/");
  revalidatePath("/settings");

  return { success: true };
}
