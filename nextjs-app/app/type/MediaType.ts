export interface MediaResponse {
  mediaCollection: {
    edges: Array<{
      node: Movie & { created_at: string };
      cursor: string;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string;
    };
  };
}

export interface Movie {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
  poster_path?: string;
  tmdb_id?: number;
}

// Represents a single node in the edges array
export interface UserWatchlistNode {
  media: Movie;
}

// Represents an edge in the GraphQL connection
export interface UserWatchlistEdge {
  node: UserWatchlistNode;
}

// The main GraphQL response for user_watchlistCollection
export interface UserWatchlistCollectionResponse {
  user_watchlistCollection: {
    edges: UserWatchlistEdge[];
  };
}