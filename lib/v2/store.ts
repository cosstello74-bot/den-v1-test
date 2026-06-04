import { createClient } from "@supabase/supabase-js";
import type { PageMetrics } from "./types";

function getClient() {
  return createClient(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_KEY ?? "",
  );
}

export async function upsertMetrics(
  update: Partial<PageMetrics> & { slug: string }
) {
  await getClient().from("page_metrics").upsert({
    ...update,
    updated_at: Date.now(),
  });
}

export async function getMetrics(slug: string): Promise<PageMetrics | null> {
  const { data } = await getClient()
    .from("page_metrics")
    .select("*")
    .eq("slug", slug)
    .single();

  return data as PageMetrics | null;
}

export async function getAllMetrics(): Promise<PageMetrics[]> {
  const { data } = await getClient().from("page_metrics").select("*");
  return (data ?? []) as PageMetrics[];
}
