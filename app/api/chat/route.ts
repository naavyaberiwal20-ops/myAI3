// app/api/chat/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isContentFlagged } from "@/lib/moderation";
import { SYSTEM_PROMPT } from "@/prompts";

/**
 * Simple, robust non-streaming chat route for quick recovery.
 * - Expects JSON body with either:
 *   { messages: UIMessage[] }  (your current UI shape) OR
 *   { message: "string" }
 *
 * Returns JSON: { reply: string }
 */

type Part = { type: "text" | string; text?: string };
type UIMessage = { role: "user" | "assistant" | "system"; parts: Part[] };

function extractTextFromParts(parts?: Part[]): string {
  if (!parts || !Array.isArray(parts)) return "";
  return parts
    .filter((p) => p?.type === "text")
    .map((p) => ("text" in p && typeof p.text === "string" ? p.text : ""))
    .join(" ")
    .trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // Normalize input: either messages[] (UI format) or a single message string
    const incomingMessages: UIMessage[] | undefined = body?.messages;
    const fallbackMessage: string | undefined = body?.message;

    // Determine latest user text
    let latestUserText = "";

    if (Array.isArray(incomingMessages) && incomingMessages.length > 0) {
      // find last user message
      const lastUser = incomingMessages
        .filter((m) => m.role === "user")
        .slice(-1)[0];
      latestUserText = extractTextFromParts(lastUser?.parts);
    }

    if (!latestUserText && typeof fallbackMessage === "string") {
      latestUserText = fallbackMessage.trim();
    }

    if (!latestUserText) {
      return NextResponse.json({ error: "No user message provided" }, { status: 400 });
    }

    // Moderation check (your existing function)
    try {
      const moderationResult = await isContentFlagged(latestUserText);
      if (moderationResult?.flagged) {
        // Return the denial message as the reply so front-end can show it
        const denial = moderationResult.denialMessage || "Your message violates our guidelines.";
        return NextResponse.json({ reply: denial });
      }
    } catch (modErr) {
      // don't block request if moderation fails — log and continue
      console.error("Moderation check failed:", modErr);
    }

    // OpenAI key
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      console.error("Missing OPENAI_API_KEY environment variable");
      return NextResponse.json({ error: "Server misconfigured (OPENAI_API_KEY missing)" }, { status: 500 });
    }

    // Model: change if you need a different variant
    const MODEL = "gpt-5.1";

    // Build the messages we send to OpenAI: system prompt (from your prompts) + user message
    const messages = [
      { role: "system", content: (SYSTEM_PROMPT ?? "You are a helpful assistant.") },
      { role: "user", content: latestUserText },
    ];

    const payload = {
      model: MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 900,
      // you can add other options here (top_p, frequency_penalty, etc.)
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const rawText = await resp.text();

    if (!resp.ok) {
      console.error("OpenAI API error:", resp.status, rawText);
      // try parse provider response and return helpful info
      let parsed = {};
      try { parsed = JSON.parse(rawText); } catch {}
      return NextResponse.json({ error: "OpenAI API error", detail: parsed }, { status: 502 });
    }

    // parse success response
    let data: any = {};
    try { data = JSON.parse(rawText); } catch (e) { data = { raw: rawText }; }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ??
      data?.choices?.[0]?.text?.trim() ??
      (typeof rawText === "string" ? rawText : JSON.stringify(data));

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("Unhandled /api/chat error:", err?.message ?? err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
