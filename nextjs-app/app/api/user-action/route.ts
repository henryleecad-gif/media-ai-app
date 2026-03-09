import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
// Import your embedding function
import { generateEmbedding } from "@/lib/pinecone/embeddings"; 

const pinecone = new Pinecone({apiKey: process.env.PINECONE_API_KEY!});
const index = pinecone.Index({ name: 'user-action' });

export async function POST(req: NextRequest) {
  const { user_id, movie_id, action, text } = await req.json();

  const embedding = await generateEmbedding(text || action);
  console.log("Generated embedding for user action:", embedding);

  await index.upsert({
    records: [
      {
        id: `${user_id}_${movie_id}_${Date.now()}`,
        values: embedding,
        metadata: { user_id, movie_id, action, timestamp: new Date().toISOString() },
      },
    ],
  });

  return NextResponse.json({ success: true });
}