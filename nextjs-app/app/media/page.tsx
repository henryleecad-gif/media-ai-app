
import MovieView from "@/components/movie-view";
import { fetchGraphQL, unwrapNodes } from "@/lib/supabase/graphqlHelper";
import { Suspense } from "react";
import {
  MediaResponse,
  UserWatchlistCollectionResponse,
} from "../type/MediaType";
import { MEDIA_QUERY, WATCHLIST_INIT_QUERY } from "../query/MediaQuery";
import { createClient } from "@/lib/supabase/server";
const FetchMovieList = async () => {
  const mediaData = await fetchGraphQL<MediaResponse>(MEDIA_QUERY, {
    first: 20,
  });
  const mediaEdges = Array.isArray(mediaData.mediaCollection.edges)
    ? mediaData.mediaCollection.edges
    : [];
  const initialMovies = unwrapNodes(mediaEdges);
  const pageInfo = mediaData.mediaCollection.pageInfo || {
    hasNextPage: false,
    endCursor: null,
  };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();
  console.log("Supabase session response:", { data, error });
  if (error) {
    console.error("Error fetching session:", error);
    return <div>Error fetching session</div>;
  }
  console.log("Session data:", { user_id: data.session?.user.id });
  const watchlistData = await fetchGraphQL<UserWatchlistCollectionResponse>(
    WATCHLIST_INIT_QUERY,
    { user_id: data.session?.user.id },
    undefined,
    data.session?.access_token,
  );
  console.log("Watchlist data:", watchlistData);
  const watchlistEdges = Array.isArray(
    watchlistData.user_watchlistCollection.edges,
  )
    ? watchlistData.user_watchlistCollection.edges
    : [];
  const initialWatchlist = unwrapNodes(watchlistEdges).map(
    (node) => node.media,
  );

  return (
    <MovieView
      initialMovies={initialMovies}
      initialPageInfo={pageInfo}
      initialWatchlist={initialWatchlist}
    />
  );
};

// server component that fetches local movies
export default async function Protected() {
  return <Suspense fallback={<div>Loading movies...</div>}><FetchMovieList /></Suspense>;
}