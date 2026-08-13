// POST /api/match  { profile, trial }  ->  MatchResult
// One OpenAI call comparing a patient profile against one trial's criteria.
// Callers fan out over this route in parallel and render results as they land.

import { NextResponse } from "next/server";
import { matchTrial } from "@/lib/match";
import type { Profile, Trial } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: { profile?: Profile; trial?: Trial };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { profile, trial } = body;
  if (!profile || !trial || !trial.nctId) {
    return NextResponse.json(
      { error: "Body must include `profile` and `trial` (with nctId)." },
      { status: 400 },
    );
  }

  try {
    const result = await matchTrial(profile, trial);
    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Match failed: ${message}` },
      { status: 502 },
    );
  }
}
