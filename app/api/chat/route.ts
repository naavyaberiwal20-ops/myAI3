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

// ❗ Use REAL backend function (NOT the tool)
import { searchPinecone } from "@/lib/pinecone";

// keep webSearch tool for fallback
import { webSearch } from "./tools/web-search";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // Get the user message text
    const latestUserMessage = messages.filter((m) => m.role === "user").pop();
    const userText =
      latestUserMessage?.parts
        ?.filter((p: any) => p.type === "text")
        .map((p: any) => p.text)
        .join(" ") || "";

    // Moderation
    if (userText) {
      const mod = await isContentFlagged(userText);
      if (mod.flagged) {
        const stream = createUIMessageStream({
          execute({ writer }) {
            writer.write({ type: "start" });
            writer.write({ type: "text-start", id: "mod" });
            writer.write({
              type: "text-delta",
              id: "mod",
              delta: mod.denialMessage,
            });
            writer.write({ type: "text-end", id: "mod" });
            writer.write({ type: "finish" });
          },
        });

        return createUIMessageStreamResponse({ stream });
      }
    }

    // --------------------------------------------------
    // 1️⃣ VECTOR DATABASE FIRST
    // --------------------------------------------------

    // ❗ FIX: Call Pinecone directly
    const vectorResults = await searchPinecone(userText);

    let resolvedContext = "";
    let useVector = false;

    if (Array.isArray(vectorResults) && vectorResults.length > 0) {
      const top = vectorResults[0];

      if (top.score >= 0.70) {
        useVector = true;
        resolvedContext = top.content;
      }
    }

    // 2️⃣ If we have a good match → answer from vector context
    if (useVector) {
      const result = streamText({
        model: MODEL,
        system: `
You are Greanly AI — a sustainability assistant.
Use the following context to answer the user.
NEVER mention documents, PDFs, Pinecone, or data sources.

CONTEXT:
${resolvedContext}
        `,
        messages: convertToModelMessages(messages),
      });

      return result.toUIMessageStreamResponse({
        sendReasoning: false,
      });
    }

    // --------------------------------------------------
    // 3️⃣ Otherwise → model can call webSearch tool
    // --------------------------------------------------

    const result = streamText({
      model: MODEL,
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),

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
    console.error("Chat route error:", err);

    const stream = createUIMessageStream({
      execute({ writer }) {
        writer.write({ type: "start" });
        writer.write({ type: "text-start", id: "fatal" });
        writer.write({
          type: "text-delta",
          id: "fatal",
          delta: "An internal error occurred. Please try again.",
        });
        writer.write({ type: "text-end", id: "fatal" });
        writer.write({ type: "finish" });
      },
    });

    return createUIMessageStreamResponse({ stream });
  }
}
