// app/api/chat/route.ts
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
import { vectorDatabaseSearch } from "./tools/search-vector-database";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // parse body safely
    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      console.error("api/chat: failed to parse JSON body", e);
      body = {};
    }
    const messages: UIMessage[] = Array.isArray(body?.messages) ? body.messages : [];

    console.log("[api/chat] incoming messages count:", messages.length);

    // Basic config check
    if (!MODEL) {
      console.error("[api/chat] MODEL is not set (check /config).");
      const stream = createUIMessageStream({
        execute({ writer }) {
          writer.write({ type: "start" });
          const id = "config-missing";
          writer.write({ type: "text-start", id });
          writer.write({
            type: "text-delta",
            id,
            delta:
              "Server configuration problem: MODEL is not set. Please set MODEL in your config (e.g. 'gpt-5.1') and redeploy.",
          });
          writer.write({ type: "text-end", id });
          writer.write({ type: "finish" });
        },
      });
      return createUIMessageStreamResponse({ stream });
    }

    // get latest user text for moderation
    const latestUserMessage = messages.filter((m) => m.role === "user").pop();

    if (latestUserMessage) {
      const textParts = (latestUserMessage.parts || [])
        .filter((p: any) => p.type === "text")
        .map((p: any) => ("text" in p ? p.text : ""))
        .join("");

      console.log("[api/chat] latest user text (first 200 chars):", textParts?.slice?.(0, 200));

      if (textParts) {
        try {
          const moderationResult = await isContentFlagged(textParts);
          if (moderationResult?.flagged) {
            console.warn("[api/chat] message flagged by moderation:", moderationResult);
            const stream = createUIMessageStream({
              execute({ writer }) {
                writer.write({ type: "start" });
                const id = "moderation-denial";
                writer.write({ type: "text-start", id });
                writer.write({
                  type: "text-delta",
                  id,
                  delta:
                    moderationResult.denialMessage ||
                    "Your message violates our guidelines. I can't answer that.",
                });
                writer.write({ type: "text-end", id });
                writer.write({ type: "finish" });
              },
            });
            return createUIMessageStreamResponse({ stream });
          }
        } catch (modErr) {
          // log moderation errors, but don't block the chat - fallback to continuing
          console.error("[api/chat] moderation check error:", modErr);
        }
      }
    }

    // call the model & stream text – wrap in try/catch to return fallback on error
    try {
      console.log("[api/chat] calling streamText with model:", MODEL);

      const result = streamText({
        model: MODEL,
        system: SYSTEM_PROMPT,
        messages: convertToModelMessages(messages),
        tools: {
          webSearch,
          vectorDatabaseSearch,
        },
        // short-circuit: stop after 10 reasoning steps (you had this previously)
        stopWhen: stepCountIs(10),
        providerOptions: {
          openai: {
            reasoningSummary: "auto",
            reasoningEffort: "low",
            parallelToolCalls: false,
          },
        },
      });

      // success: return the streaming response to client
      return result.toUIMessageStreamResponse({
        sendReasoning: true,
      });
    } catch (modelErr) {
      // Model call failed — log and return a friendly fallback to the user
      console.error("[api/chat] streamText/model error:", modelErr);

      const stream = createUIMessageStream({
        execute({ writer }) {
          writer.write({ type: "start" });
          const id = "model-error";
          writer.write({ type: "text-start", id });
          writer.write({
            type: "text-delta",
            id,
            delta:
              "Sorry — I couldn't generate a response right now. The server logged an error. Please check the server logs.",
          });
          writer.write({ type: "text-end", id });
          writer.write({ type: "finish" });
        },
      });

      return createUIMessageStreamResponse({ stream });
    }
  } catch (err) {
    // top-level failure — ensure client still gets a reply
    console.error("[api/chat] top-level handler error:", err);

    const stream = createUIMessageStream({
      execute({ writer }) {
        writer.write({ type: "start" });
        const id = "fatal-error";
        writer.write({ type: "text-start", id });
        writer.write({
          type: "text-delta",
          id,
          delta: "Server error handling request. See server logs for details.",
        });
        writer.write({ type: "text-end", id });
        writer.write({ type: "finish" });
      },
    });

    return createUIMessageStreamResponse({ stream });
  }
}
