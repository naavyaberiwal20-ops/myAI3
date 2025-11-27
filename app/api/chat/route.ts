import {
  streamText,
  UIMessage,
  convertToModelMessages,
  stepCountIs,
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";

import { MODEL } from "@/config";
import { SYSTEM_PROMPT } from "@/prompts";
import { isContentFlagged } from "@/lib/moderation";

import { webSearch } from "./tools/web-search";
import { searchPinecone } from "@/lib/pinecone";

// how many context characters to consider "strong match"
const RAG_MIN_CONTEXT_LENGTH = 120;

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    // 1) moderation check
    const latestUserMessage = messages.filter((m) => m.role === "user").pop();
    let userText = "";

    if (latestUserMessage) {
      userText = latestUserMessage.parts
        .filter((p: any) => p.type === "text")
        .map((p: any) => p.text || "")
        .join(" ");

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
                delta:
                  mod.denialMessage ??
                  "Your message violates our guidelines. I can't answer that.",
              });
              writer.write({ type: "text-end", id: "mod" });

              writer.write({ type: "finish" });
            },
          });

          return createUIMessageStreamResponse({ stream });
        }
      }
    }

    // 2) ALWAYS query Pinecone first
    // This returns a string containing extracted context OR "" if nothing useful
    const ragContext = await searchPinecone(userText);

    // If context exists, prepend it to the LLM system prompt
    const fullSystemPrompt = ragContext.trim().length > RAG_MIN_CONTEXT_LENGTH
      ? `${SYSTEM_PROMPT}

========================
CONTEXT FROM KNOWLEDGE BASE
(Use this **silently**. Do NOT mention the database.)
========================
${ragContext}
========================

When replying:
- ONLY use this context if relevant.
- If irrelevant or incomplete, think and answer normally.
- NEVER tell the user the source.`
      : SYSTEM_PROMPT;

    // 3) Run LLM with webSearch as fallback
    const result = streamText({
      model: MODEL,
      system: fullSystemPrompt,
      messages: convertToModelMessages(messages),
      tools: {
        webSearch,
      },
      stopWhen: stepCountIs(10),
      providerOptions: {
        openai: {
          reasoningSummary: "auto",
          reasoningEffort: "low",
          parallelToolCalls: false,
        },
      },
    });

    return result.toUIMessageStreamResponse({ sendReasoning: true });
  } catch (err) {
    console.error("Chat route runtime error:", err);

    const stream = createUIMessageStream({
      execute({ writer }) {
        writer.write({ type: "start" });

        writer.write({ type: "text-start", id: "fatal-error" });
        writer.write({
          type: "text-delta",
          id: "fatal-error",
          delta:
            "Sorry — the assistant encountered an internal error. Please try again shortly.",
        });
        writer.write({ type: "text-end", id: "fatal-error" });

        writer.write({ type: "finish" });
      },
    });

    return createUIMessageStreamResponse({ stream });
  }
}
