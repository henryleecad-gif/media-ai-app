export async function fetchGraphQL<T>(
  query: string,
  variables: Record<string, any> = {},
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        Authorization: `Bearer ${accessToken || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      ...options,
    },
  );

  const json = await res.json();

  if (!res.ok || json.errors) {
    throw new Error(JSON.stringify(json.errors ?? "GraphQL request failed"));
  }

  return json.data;
}


export function unwrapNodes<T>(edges: { node: T }[]): T[] {
  return edges.map(e => e.node);
}