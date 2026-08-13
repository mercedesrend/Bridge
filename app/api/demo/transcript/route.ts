import { NextResponse } from "next/server";
import { DEMO_PATIENT, DEMO_TRANSCRIPT } from "@/lib/data";

export function GET() {
  return NextResponse.json({ turns: DEMO_TRANSCRIPT, patient: DEMO_PATIENT });
}
