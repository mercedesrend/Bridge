import { NextResponse } from "next/server";
import { parsePatientProfile } from "@/lib/server/llm";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { rawDescription?: string };
    if (!body.rawDescription?.trim()) {
      return NextResponse.json({ error: "rawDescription is required" }, { status: 400 });
    }

    const parsed = await parsePatientProfile(body.rawDescription);
    return NextResponse.json(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to parse profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
