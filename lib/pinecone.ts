// lib/pinecone.ts
import { Pinecone } from "@pinecone-database/pinecone";
import { PINECONE_TOP_K, PINECONE_INDEX_NAME } from "@/config";
import {
  searchResultsToChunks,
  getSourcesFromChunks,
  getContextFromSources,
} from "@/lib/sources";

if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is not set");
}

if (!PINECONE_INDEX_NAME) {
  throw new Error("PINECONE_INDEX_NAME is not set in config");
}

// create client
export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// create index handle (this will throw early if the name is invalid)
export const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);

// safe numeric fallback
const TOP_K = typeof PINECONE_TOP_K === "number" && PINECONE_TOP_K > 0 ? PINECONE_TOP_K : 5;

/**
 * searchPinecone
 * - Performs a vector/text search and returns a compact XML-like results wrapper
 * - Returns a string (not JSX). Use plain text with no extra spaces in tags to avoid parser confusion.
 */
export async function searchPinecone(query: string): Promise<string> {
  if (!query || typeof query !== "string") {
    return "";
  }

  try {
    const response = await pineconeIndex.namespace("default").searchRecords({
      query: {
        inputs: {
          text: query,
        },
        topK: TOP_K,
      },
      fields: [
        "text",
        "pre_context",
        "post_context",
        "source_url",
        "source_description",
        "source_type",
        "order",
      ],
    });

    // convert response into chunks / sources / context (your helpers)
    const chunks = searchResultsToChunks(response);
    const sources = getSourcesFromChunks(chunks);
    const context = getContextFromSources(sources) || "";

    // Return a plain string with compact tags (no spaces inside the angle brackets).
    return `<results>${context}</results>`;
  } catch (err) {
    // log full error for Vercel logs and return an empty result so callers can handle gracefully
    // eslint-disable-next-line no-console
    console.error("[lib/pinecone] searchPinecone error:", err);
    return "";
  }
}
