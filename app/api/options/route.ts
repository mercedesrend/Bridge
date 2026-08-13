import { NextResponse } from "next/server";
import { retrieveOptions } from "@/lib/server/options";
import { PatientProfile } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const profile = (await request.json()) as PatientProfile;
    if (!profile.condition?.trim()) {
      return NextResponse.json({ error: "Condition is required" }, { status: 400 });
    }

    const payload = await retrieveOptions(profile);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch options";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
