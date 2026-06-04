import { runV2Cycle } from "@/scripts/v2-cycle";

export async function GET() {
  await runV2Cycle({});
  return Response.json({ ok: true });
}
