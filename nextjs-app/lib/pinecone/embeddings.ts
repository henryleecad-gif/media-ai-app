// lib/embeddings.ts
import { pipeline } from '@xenova/transformers'
import type { FeatureExtractionPipeline } from '@xenova/transformers'

// Singleton to avoid loading model multiple times
let embedPipeline: FeatureExtractionPipeline | null = null;

// Helper: average token embeddings for a single sequence
function averageTokens(tokens: number[][]): number[] {
  const dim = tokens[0].length
  const avg = new Array(dim).fill(0)
  for (const tok of tokens) {
    for (let i = 0; i < dim; i++) {
      avg[i] += tok[i]
    }
  }
  return avg.map(x => x / tokens.length)
}

export async function generateEmbedding(text: string ) {
  if (!embedPipeline) {
    embedPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  }
  const embeddings = await embedPipeline(text)
  // embeddings is [tokens, dim]
  return averageTokens(embeddings.tolist() as number[][])
  
}