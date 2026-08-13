import { NextResponse } from "next/server";
import { suggestNextSteps } from "@/lib/server/llm";
import { PatientProfile } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      profile?: PatientProfile;
      questions?: { text: string; note: string; status: string }[];
    };

    if (!body.profile || !body.questions?.length) {
      return NextResponse.json({ steps: [] });
    }

    const payload = await suggestNextSteps({
      profile: body.profile,
      questions: body.questions
    });
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to suggest next steps";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
