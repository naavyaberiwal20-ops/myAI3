import { Pinecone } from '@pinecone-database/pinecone';
import { PINECONE_TOP_K, PINECONE_INDEX_NAME } from '@/config';
import {
  searchResultsToChunks,
  getSourcesFromChunks,
  getContextFromSources
} from '@/lib/sources';

if (!process.env.PINECONE_API_KEY) {
  throw new Error('PINECONE_API_KEY is not set');
}

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

export const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);

/**
 * ✅ This function now returns properly structured similarity results:
 * [
 *   { content: "...", score: 0.92 }
 * ]
 *
 * This is REQUIRED for the hybrid RAG system.
 */

export async function searchPinecone(query: string): Promise<
  { content: string; score: number }[]
> {
  try {
    const results = await pineconeIndex
      .namespace("default")
      .searchRecords({
        query: {
          inputs: {
            text: query,
          },
          topK: PINECONE_TOP_K,
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

    // Turn raw Pinecone matches into chunks
    const chunks = searchResultsToChunks(results);

    if (!chunks || chunks.length === 0) {
      return [];
    }

    const sources = getSourcesFromChunks(chunks);
    const context = getContextFromSources(sources);

    // 🔥 Return the structured result the hybrid RAG pipeline expects
    return [
      {
        content: context,
        score: chunks[0]?.score ?? 0,
      },
    ];
  } catch (err) {
    console.error("Pinecone Search Error:", err);
    return [];
  }
}
