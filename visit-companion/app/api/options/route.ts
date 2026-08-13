import { NextResponse } from "next/server";
import { modeReport } from "@/lib/config";
import { DEMO_PATIENT, LANGUAGES, READING_LEVELS } from "@/lib/data";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    languages: LANGUAGES,
    reading_levels: READING_LEVELS,
    demo_patient: DEMO_PATIENT,
    mode: modeReport(),
  });
}
