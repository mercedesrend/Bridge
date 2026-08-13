import { NextResponse } from "next/server";
import { modeReport } from "@/lib/config";
import { nowIso } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true, mode: modeReport(), at: nowIso() });
}
