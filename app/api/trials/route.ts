// GET /api/trials?cond=<condition>
// Proxies ClinicalTrials.gov and returns normalized, recruiting trials.

import { NextResponse } from "next/server";
import { fetchTrials } from "@/lib/clinicaltrials";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cond = (searchParams.get("cond") || "").trim();

  if (!cond) {
    return NextResponse.json(
      { error: "Missing required `cond` parameter." },
      { status: 400 },
    );
  }

  try {
    const trials = await fetchTrials(cond, 40);
    return NextResponse.json({ trials });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch trials: ${message}` },
      { status: 502 },
    );
  }
}
