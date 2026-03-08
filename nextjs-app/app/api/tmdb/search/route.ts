import { NextResponse } from "next/server";
import { searchTMDB } from "@/lib/tmdb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchTMDB(q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("TMDB search error", err);
    return NextResponse.json({ error: "search failed" }, { status: 500 });
  }
}
