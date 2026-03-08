export const MEDIA_QUERY = `
query MediaList($first: Int!, $after: Cursor, $search: String) {
  mediaCollection(
    first: $first, 
    after: $after, 
    orderBy: {popularity: DescNullsLast}
  	filter: {title: {ilike: $search}}) {
    edges {
      node {
        id
        title
        popularity
        created_at
        poster_path
        overview
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
`;

export const WATCHLIST_INIT_QUERY = `query UserWatchlist($user_id: UUID!) {
  user_watchlistCollection(filter: { user_id: { eq: $user_id } }) {
    edges {
      node {
        media {
          id
          title
          overview
        }
      }
    }
  }
}`;