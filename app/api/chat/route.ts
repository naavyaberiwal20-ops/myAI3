// app/api/chat/route.ts
// COPY + REPLACE this entire file

import { streamText, UIMessage, convertToModelMessages, stepCountIs, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { MODEL } from '@/config';
import { SYSTEM_PROMPT } from '@/prompts';
import { isContentFlagged } from '@/lib/moderation';
import { webSearch } from './tools/web-search';
import { vectorDatabaseSearch } from './tools/search-vector-database';

// Maximum allowed handler runtime (informational)
export const maxDuration = 30;

function createErrorStreamResponse(message: string) {
  const stream = createUIMessageStream({
    execute({ writer }) {
      const id = 'server-error';
      writer.write({ type: 'start' });
      writer.write({ type: 'text-start', id });
      writer.write({ type: 'text-delta', id, delta: message });
      writer.write({ type: 'text-end', id });
      writer.write({ type: 'finish' });
    },
  });
  return createUIMessageStreamResponse({ stream });
}

/**
 * POST /api/chat
 */
export async function POST(req: Request) {
  try {
    // Basic defensive checks and logs so Vercel logs show what happened:
    console.log('[chat.route] Received request at', new Date().toISOString());

    // parse body
    let body: any;
    try {
      body = await req.json();
    } catch (err) {
      console.error('[chat.route] Failed to parse JSON body', err);
      return createErrorStreamResponse("Malformed request. Couldn't parse JSON body.");
    }

    const messages: UIMessage[] | undefined = body?.messages;
    if (!messages || !Array.isArray(messages)) {
      console.warn('[chat.route] Missing or invalid "messages" in request body', { messages });
      return createErrorStreamResponse('No messages were provided. Please send a valid conversation payload.');
    }

    // pick the latest user message (if any)
    const latestUserMessage = messages.filter(m => m.role === 'user').pop();

    if (latestUserMessage) {
      // extract text for moderation
      const textParts = (latestUserMessage.parts || [])
        .filter((p: any) => p?.type === 'text')
        .map((p: any) => ('text' in p ? p.text : ''))
        .join('');

      if (textParts) {
        console.log('[chat.route] Running moderation for user text');
        try {
          const moderationResult = await isContentFlagged(textParts);
          if (moderationResult?.flagged) {
            console.warn('[chat.route] Message flagged by moderation', moderationResult);
            // stream the denial message
            const stream = createUIMessageStream({
              execute({ writer }) {
                const textId = 'moderation-denial-text';
                writer.write({ type: 'start' });
                writer.write({ type: 'text-start', id: textId });
                writer.write({
                  type: 'text-delta',
                  id: textId,
                  delta: moderationResult.denialMessage || "Your message violates our guidelines. I can't answer that.",
                });
                writer.write({ type: 'text-end', id: textId });
                writer.write({ type: 'finish' });
              },
            });

            return createUIMessageStreamResponse({ stream });
          }
        } catch (modErr) {
          console.error('[chat.route] Moderation check failed', modErr);
          // don't block the request completely if moderation service fails — log and continue
        }
      }
    }

    // Ensure we have a model name. If MODEL is not set, pick a sensible default.
    const modelName = MODEL || 'gpt-5.1';
    if (!MODEL) {
      console.warn('[chat.route] MODEL not defined in config; falling back to', modelName);
    }

    // Build and start the streaming response to the client.
    console.log('[chat.route] Starting streamText with model', modelName);
    let result;
    try {
      result = streamText({
        model: modelName,
        system: SYSTEM_PROMPT,
        messages: convertToModelMessages(messages),
        tools: {
          webSearch,
          vectorDatabaseSearch,
        },
        // stop after a small number of reasoning steps to avoid silent hang ups
        stopWhen: stepCountIs(10),
        providerOptions: {
          openai: {
            // these options depend on the 'ai' lib you use; safe defaults
            reasoningSummary: 'auto',
            reasoningEffort: 'low',
            parallelToolCalls: false,
          },
        },
      });
    } catch (streamErr) {
      console.error('[chat.route] streamText threw an error', streamErr);
      return createErrorStreamResponse('Internal error: failed to start model stream. Check server logs.');
    }

    // Convert streaming result to UIMessageStreamResponse and return it.
    try {
      return result.toUIMessageStreamResponse({
        sendReasoning: true,
      });
    } catch (convErr) {
      console.error('[chat.route] result.toUIMessageStreamResponse failed', convErr);
      return createErrorStreamResponse('Internal error: streaming response failed to initialize.');
    }
  } catch (err) {
    // Catch-all: stream a friendly error back to the client and log the stack
    console.error('[chat.route] Unexpected error in POST handler', err);
    return createErrorStreamResponse('An unexpected server error occurred. Check logs for details.');
  }
}
