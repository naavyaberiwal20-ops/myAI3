// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/prompts";
import { isContentFlagged } from "@/lib/moderation";

/**
 * Very defensive chat route:
 * - Accepts { messages: UIMessage[] } (your UI shape) OR { message: "string" }
 * - Runs moderation check (but continues if moderation throws)
 * - Calls OpenAI chat/completions with timeout
 * - Returns JSON { ok, reply, error?, debug? }
 *
 * COPY + REPLACE this file and deploy.
 */

type Part = { type?: string; text?: string };
type UIMessage = { role?: string; parts?: Part[] };

function extractTextFromParts(parts?: Part[] | any): string {
  if (!parts || !Array.isArray(parts)) return "";
  return parts
    .map((p) => (p && typeof p.text === "string" ? p.text : ""))
    .join(" ")
    .trim();
}

function getLastUserMessage(messages?: UIMessage[] | any): string {
  if (!Array.isArray(messages)) return "";
  // walk from end for last user
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m) continue;
    const role = (m.role || "").toString().toLowerCase();
    if (role === "user") {
      // try parts first
      const parts = m.parts ?? m.content ?? m.text ?? [];
      const extracted = extractTextFromParts(parts);
      if (extracted) return extracted;
      // fallback to "content" if it's a string
      if (typeof m.content === "string" && m.content.trim()) return m.content.trim();
      if (typeof m.text === "string" && m.text.trim()) return m.text.trim();
    }
  }
  return "";
}

export async function POST(req: Request) {
  // Always return JSON (helpful for debugging)
  try {
    const body = await req.json().catch(() => ({}));
    const incomingMessages = Array.isArray(body?.messages) ? body.messages : undefined;
    const fallbackMessage = typeof body?.message === "string" ? body.message : undefined;

    // find latest user message
    let latestUserText = getLastUserMessage(incomingMessages);
    if (!latestUserText && fallbackMessage) latestUserText = fallbackMessage.trim();

    if (!latestUserText) {
      return NextResponse.json({ ok: false, error: "No user message provided" }, { status: 400 });
    }

    // Moderation check - don't fail the whole request if moderation errors
    try {
      const mod = await isContentFlagged(latestUserText);
      if (mod?.flagged) {
        const denial = mod.denialMessage || "Your message violates our guidelines. I can't answer that.";
        console.warn("Moderation flagged message. Returning denial.");
        return NextResponse.json({ ok: true, reply: denial, moderated: true });
      }
    } catch (mErr) {
      console.error("Moderation function threw an error; continuing request. Error:", mErr);
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      console.error("Missing OPENAI_API_KEY environment variable.");
      return NextResponse.json({ ok: false, error: "OPENAI_API_KEY missing on server" }, { status: 500 });
    }

    // MODEL — change if your account uses different name (gpt-5.1, gpt-5.1-mini, etc.)
    const MODEL = "gpt-5.1";

    // Build messages for OpenAI
    const messages = [
      { role: "system", content: typeof SYSTEM_PROMPT === "string" && SYSTEM_PROMPT.length > 0 ? SYSTEM_PROMPT : "You are a helpful assistant." },
      { role: "user", content: latestUserText },
    ];

    // Timeout and fetch options
    const controller = new AbortController();
    const TIMEOUT_MS = 20000; // 20s
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let openaiStatus = -1;
    let openaiBodyText = "";

    try {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature: 0.2,
          max_tokens: 900,
        }),
      });

      openaiStatus = resp.status;
      openaiBodyText = await resp.text();

      if (!resp.ok) {
        console.error("OpenAI API returned non-OK:", resp.status, openaiBodyText);
        // return helpful debug info but still user-friendly message
        return NextResponse.json({
          ok: false,
          error: "OpenAI API error",
          openaiStatus,
          openaiBody: openaiBodyText,
        }, { status: 502 });
      }

      // parse
      let data: any;
      try {
        data = JSON.parse(openaiBodyText);
      } catch (e) {
        data = { raw: openaiBodyText };
      }

      const reply =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        (typeof openaiBodyText === "string" ? openaiBodyText : JSON.stringify(data));

      clearTimeout(timeout);

      // Success — return reply
      return NextResponse.json({
        ok: true,
        reply: (reply || "").toString().trim(),
        debug: { openaiStatus, model: MODEL },
      });
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      // handle timeout/abort
      const isAbort = fetchErr?.name === "AbortError" || fetchErr?.message?.toLowerCase()?.includes("aborted");
      console.error("OpenAI fetch failed:", fetchErr?.message ?? fetchErr, "abort?", isAbort);
      // Fallback: return friendly fallback reply so UI doesn't hang
      const fallback = "Sorry — I'm temporarily unavailable. Please try again in a few seconds.";
      return NextResponse.json({
        ok: false,
        error: "OpenAI request failed",
        message: fallback,
        fetchError: String(fetchErr?.message ?? fetchErr),
        openaiStatus,
        openaiBody: openaiBodyText,
      }, { status: 502 });
    }
  } catch (err: any) {
    console.error("Unhandled error in /api/chat:", err);
    return NextResponse.json({ ok: false, error: "Internal server error", detail: String(err?.message ?? err) }, { status: 500 });
  }
}
