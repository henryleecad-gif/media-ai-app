export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date?: string;
  poster_path?: string;
}

export async function searchTMDB(query: string): Promise<TMDBMovie[]> {
  const apiKey = process.env.NEXT_TMDB_API_KEY;
  const token = process.env.NEXT_TMDB_ACCESS_TOKEN;
  if (!apiKey || !token) {
    throw new Error("TMDB API key or access token not configured");
  }

  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
    query,
  )}&api_key=${apiKey}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`TMDB search failed with ${res.status}`);
  }

  const data = await res.json();
  return data.results as TMDBMovie[];
}
