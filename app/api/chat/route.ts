/**
 * HYBRID RAG PIPELINE:
 * 1. First: check vector database manually (most reliable)
 * 2. If similarity >= 0.70 — answer ONLY from that context
 * 3. If similarity < 0.70 — fallback to webSearch tool
 * 4. User never sees source (“document / web / vector”)
 */

import {
  streamText,
  UIMessage,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";

import { MODEL } from "@/config";
import { SYSTEM_PROMPT } from "@/prompts";
import { isContentFlagged } from "@/lib/moderation";

import { webSearch } from "./tools/web-search";
import { vectorDatabaseSearch } from "./tools/search-vector-database";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // ---------------------------
    // 1. MODERATION CHECK
    // ---------------------------
    const latestUserMessage = messages.filter((m) => m.role === "user").pop();

    if (latestUserMessage) {
      const textParts = latestUserMessage.parts
        .filter((p) => p.type === "text")
        .map((p: any) => p.text || "")
        .join("");

      if (textParts) {
        const moderation = await isContentFlagged(textParts);
        if (moderation.flagged) {
          const stream = createUIMessageStream({
            execute({ writer }) {
              const id = "moderation-denial-text";
              writer.write({ type: "start" });
              writer.write({ type: "text-start", id });
              writer.write({
                type: "text-delta",
                id,
                delta:
                  moderation.denialMessage ||
                  "Your message violates our guidelines.",
              });
              writer.write({ type: "text-end", id });
              writer.write({ type: "finish" });
            },
          });

          return createUIMessageStreamResponse({ stream });
        }
      }
    }

    // ---------------------------
    // 2. MANUAL VECTOR SEARCH FIRST
    // ---------------------------
    const userText =
      latestUserMessage?.parts
        ?.map((p: any) => (p.type === "text" ? p.text : ""))
        .join(" ") || "";

    const vectorResults = await vectorDatabaseSearch({
      query: userText,
      topK: 3,
    });

    let resolvedContext = "";
    let useVector = false;

    if (Array.isArray(vectorResults) && vectorResults.length > 0) {
      const top = vectorResults[0];

      // similarity threshold (tune between 0.65–0.80)
      if (top.score >= 0.70) {
        useVector = true;
        resolvedContext = top.content;
      }
    }

    // ---------------------------
    // 3. IF VECTOR MATCH → ANSWER DIRECTLY
    // ---------------------------
    if (useVector) {
      const result = streamText({
        model: MODEL,
        system: `
You are Greanly AI — a sustainability and business efficiency assistant.

Use the following context to answer the user.  
DO NOT reveal where the information came from.  
Do NOT say "based on the document" or "from the vector database".

CONTEXT:
${resolvedContext}
        `,
        messages: convertToModelMessages(messages),
      });

      return result.toUIMessageStreamResponse({
        sendReasoning: false,
      });
    }

    // ---------------------------
    // 4. OTHERWISE FALLBACK TO NORMAL CHAT WITH webSearch ENABLED
    // ---------------------------
    const result = streamText({
      model: MODEL,
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),

      // Now allow the model to call webSearch only when vector failed
      tools: {
        webSearch,
      },

      providerOptions: {
        openai: {
          reasoningSummary: "auto",
          reasoningEffort: "low",
          parallelToolCalls: false,
        },
      },
    });

    return result.toUIMessageStreamResponse({
      sendReasoning: true,
    });
  } catch (err) {
    console.error("Chat route runtime error:", err);

    const stream = createUIMessageStream({
      execute({ writer }) {
        const id = "fatal-error-text";
        writer.write({ type: "start" });
        writer.write({ type: "text-start", id });
        writer.write({
          type: "text-delta",
          id,
          delta:
            "Sorry — something went wrong. Please try again in a moment.",
        });
        writer.write({ type: "text-end", id });
        writer.write({ type: "finish" });
      },
    });

    return createUIMessageStreamResponse({ stream });
  }
}
