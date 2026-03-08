"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Input,
  Card,
  Image,
  Row,
  Col,
  Space,
  Spin,
  Skeleton,
  Tabs,
  Button,
  Badge,
  Table,
  message,
} from "antd";
import { fetchGraphQL, unwrapNodes } from "@/lib/supabase/graphqlHelper";
import { MediaResponse, Movie } from "../app/type/MediaType";
import { MEDIA_QUERY } from "@/app/query/MediaQuery";
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";
import { createClient } from "@/lib/supabase/client";

interface Props {
  initialMovies: Movie[];
  initialPageInfo?: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
  initialWatchlist?: Movie[];
}

export default function MovieView({
  initialMovies,
  initialPageInfo,
  initialWatchlist,
}: Props) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(
    initialPageInfo?.hasNextPage ?? true,
  );
  const [endCursor, setEndCursor] = useState<string | null>(
    initialPageInfo?.endCursor ?? null,
  );
  const observerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("1");
  const [messageApi, contextHolder] = message.useMessage();

  const [watchlist, setWatchlist] = useState<Movie[]>(initialWatchlist || []);

  const loadMoreMovies = useCallback(
    async (
      queryParam: string = "%%",
      cursor: string | null = endCursor,
      changeQueryFlag: boolean = false,
    ) => {
      if (loadingMore) return;

      setLoadingMore(true);
      try {
        const variables = { after: cursor, first: 20, search: queryParam };
        const data = await fetchGraphQL<MediaResponse>(MEDIA_QUERY, variables);
        const newMovies = unwrapNodes(data.mediaCollection.edges);
        if (changeQueryFlag) {
          console.log("Changing query, resetting movies");
          setMovies([...newMovies]);
        } else {
          setMovies((prev) => [...prev, ...newMovies]);
        }

        setHasNextPage(data.mediaCollection.pageInfo.hasNextPage);
        setEndCursor(data.mediaCollection.pageInfo.endCursor);
      } catch (error) {
        console.error("Failed to load more movies:", error);
      } finally {
        setLoadingMore(false);
      }
    },
    [loadingMore, endCursor],
  );

  const columns = [
    { title: "Title", dataIndex: "title", key: "title" },
    { title: "Overview", dataIndex: "overview", key: "overview" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => toggleWatchList(record.id)}>Delete</a>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    if (activeTab !== "1") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !loadingMore) {
          loadMoreMovies();
        }
      },
      { threshold: 0.1 },
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loadMoreMovies, hasNextPage, loadingMore, activeTab]);

  const handleSearch = (query: string) => {
    const formatted = query ? `%${query}%` : "%%";

    setEndCursor(null);
    setHasNextPage(true);
    setLoadingMore(false);
    // fetch first page immediately
    loadMoreMovies(formatted, null, true);
  };

  const toggleWatchList = (movieId: number) => {
    setWatchlist((prev) => {
      const isAlreadyInWatchlist = prev.some((item) => item.id === movieId);
      if (isAlreadyInWatchlist) {
        return prev.filter((item) => item.id !== movieId);
      } else {
        const movie = movies.find((m) => m.id === movieId);
        if (movie) {
          return [...prev, { ...movie }];
        }
        return prev;
      }
    });
  };

  async function syncUserWatchlist(media_ids: number[]) {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    const authId = user?.id;
    const { data, error } = await supabase.rpc("sync_user_watchlist", {
      p_user_id: authId,
      p_media_ids: media_ids,
    });

    if (error) {
      console.error("Error syncing watchlist:", error);
      return { success: false, error };
    }
    return { success: true, insertedCount: data };
  }

  const saveWatchList = async () => {
    // Implement your save logic here, e.g., send watchlist to backend or localStorage
    const mediaIds = watchlist.map((item) => item.id);
    const result = await syncUserWatchlist(mediaIds);
    if (result.success) {
      messageApi.success(`Saved ${result.insertedCount} items successfully!`);
    } else {
      messageApi.error("Failed to save watchlist.");
    }
  };

  const isInWatchlist = (movieId: number) =>
    watchlist.some((item) => item.id === movieId);

  return (
    <div>
      {contextHolder}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 py-1">
        {/* Page Header - Fixed at top  */}
        <div className="mb-2">
          <Tabs
            activeKey={activeTab}
            onChange={(activeTab) => {
              setActiveTab(activeTab);
            }}
            size="large"
            className="w-full [&_.ant-tabs-nav]:w-full"
            items={[
              {
                key: "1",
                label: "Collections",
              },
              {
                key: "2",
                label: (
                  <Badge
                    count={watchlist.length}
                    offset={[8, 0]}
                    size="small"
                    color="red"
                  >
                    Watchlist
                  </Badge>
                ),
              },
            ]}
          />
        </div>
        {/* Search Bar - Fixed at top */}
        {activeTab === "1" && (
          <div className="m-6 ">
            <div className="mx-auto w-full">
              <Input.Search
                placeholder="Search for movies or shows..."
                enterButton="Search"
                size="large"
                onSearch={handleSearch}
                allowClear
              />
            </div>
          </div>
        )}
      </div>
      <div className="w-full">
        {activeTab === "1" && (
          <Space orientation="vertical" size="large" className="w-full">
            {/* Library */}
            {movies.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Your Library</h3>
                <Row gutter={[16, 16]}>
                  {movies.map((mo) => (
                    <Col
                      key={mo.id}
                      xs={12}
                      sm={12}
                      md={8}
                      lg={6}
                      style={{ display: "flex" }}
                    >
                      <Card
                        hoverable
                        onClick={() => {
                          toggleWatchList(mo.id);
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          minWidth: 215,
                        }}
                        styles={{ body: { flex: 1, overflow: "auto" } }}
                        cover={
                          <Image
                            alt={mo.title}
                            src={`https://image.tmdb.org/t/p/w300${mo.poster_path}`}
                            style={{ height: 300, objectFit: "cover" }}
                            placeholder={
                              <div
                                style={{
                                  height: 300,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  backgroundColor: "#f5f5f5",
                                }}
                              >
                                <Skeleton.Image
                                  active
                                  style={{
                                    height: 300,
                                    width: "100%",
                                  }}
                                />
                              </div>
                            }
                          />
                        }
                      >
                        <Card.Meta
                          title={
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              {/* Title text with ellipsis */}
                              <span
                                style={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  flex: 1, // take all remaining space
                                  marginRight: 8, // gap between text and button
                                }}
                                title={mo.title} // tooltip shows full title
                              >
                                {mo.title}
                              </span>

                              {/* Icon button */}
                              <Button
                                type="text" // removes default ripple/background
                                shape="circle"
                                size="small"
                                icon={
                                  !isInWatchlist(mo.id) ? (
                                    <PlusOutlined />
                                  ) : (
                                    <MinusOutlined />
                                  )
                                }
                                style={{
                                  flexShrink: 0, // prevent shrinking
                                  zIndex: 2, // always on top
                                  padding: 0,
                                  border: "none",
                                  background: "transparent",
                                }}
                              />
                            </div>
                          }
                          description={
                            mo.overview
                              ? mo.overview.substring(0, 100) + "..."
                              : "No description"
                          }
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
                {
                  <div
                    ref={observerRef}
                    className="flex justify-center items-center py-8"
                  >
                    {loadingMore ? <Spin size="large" /> : null}
                  </div>
                }
              </div>
            )}

            {movies.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No media available.
              </div>
            )}
          </Space>
        )}
        {activeTab === "2" && (
          <div className="w-full min-h-[200px] py-8 flex flex-col">
            {/* Table */}
            <div className="flex-1">
              <Table
                columns={columns}
                dataSource={watchlist}
                rowKey={(record) => record.id} // ensure unique keys
                pagination={{ pageSize: 5 }}
              />
            </div>

            {/* Buttons below table */}
            <div className="flex justify-end mt-4 space-x-2">
              <Button type="default" onClick={() => setWatchlist([])}>
                Clear Watchlist
              </Button>
              <Button type="primary" onClick={saveWatchList}>
                Save Watchlist
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
