// POST /api/ask  { messages, context }  ->  streamed plain-text reply
// Backs the Ask Bridge panel. Streams UTF-8 text chunks as the model produces
// them; the client appends them to the in-flight assistant message.

import { NextResponse } from "next/server";
import { getOpenAI, ASK_MODEL } from "@/lib/openai";
import {
  MAX_HISTORY,
  MAX_MESSAGE_CHARS,
  SYSTEM_PROMPT,
  describeProfile,
  labelForPath,
  type AskRequestBody,
  type ChatRole,
} from "@/lib/askBridge";

export const runtime = "nodejs";
export const maxDuration = 60;

function isRole(value: unknown): value is ChatRole {
  return value === "user" || value === "assistant";
}

export async function POST(request: Request) {
  let body: Partial<AskRequestBody>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const history = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => isRole(m?.role) && typeof m?.content === "string")
    .map((m) => ({
      role: m.role as ChatRole,
      content: m.content.slice(0, MAX_MESSAGE_CHARS),
    }))
    .filter((m) => m.content.trim().length > 0)
    .slice(-MAX_HISTORY);

  if (!history.length || history[history.length - 1].role !== "user") {
    return NextResponse.json(
      { error: "Body must include `messages` ending with a user turn." },
      { status: 400 },
    );
  }

  const pathname = body.context?.pathname ?? "/";
  const label = body.context?.label || labelForPath(pathname);
  const profile = describeProfile(body.context?.profile);

  const contextNote = [
    `The person is on the "${label}" screen of Bridge (${pathname}).`,
    profile
      ? `They have entered this profile for trial matching. Use it for context; do not repeat it back in full:\n${profile}`
      : "They have not entered a health profile yet. Do not assume a diagnosis.",
  ].join("\n\n");

  let stream;
  try {
    const openai = getOpenAI();
    stream = await openai.chat.completions.create({
      model: ASK_MODEL,
      temperature: 0.3,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: contextNote },
        ...history,
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Bridge could not reach the model: ${message}` },
      { status: 502 },
    );
  }

  const encoder = new TextEncoder();
  const body$ = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content;
          if (token) controller.enqueue(encoder.encode(token));
        }
      } catch (err) {
        // The response has already begun, so surface the failure inline
        // rather than swallowing it into a silently truncated answer.
        const message = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(
          encoder.encode(`\n\n[Bridge lost the connection: ${message}]`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body$, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
