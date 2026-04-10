"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/services/api-client";

function PostCard({ post, onLike }) {
  return (
    <article className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl shadow-slate-950/20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-brand-light">
            {post.type.replaceAll("_", " ")}
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{post.title}</h2>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-300">{post.content}</p>

      {post.media?.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {post.media.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 px-4 py-6 text-sm text-slate-400"
            >
              {item}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => onLike(post.id)}
          className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition hover:border-brand/40 hover:bg-brand/10"
        >
          Like · {post.likesCount}
        </button>
        <Link
          href={`/post/${post.id}`}
          className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition hover:border-brand/40"
        >
          Comments · {post.commentsCount}
        </Link>
        {post.playerId ? (
          <Link
            href={`/player/${post.playerId}`}
            className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition hover:border-brand/40"
          >
            Player Profile
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export default function FeedClient() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);

  const limit = 10;
  const postIds = useMemo(() => new Set(posts.map((post) => post.id)), [posts]);

  useEffect(() => {
    let active = true;

    async function loadFeed() {
      try {
        setLoading(true);
        const response = await apiFetch(`/api/feed?page=${page}&limit=${limit}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || "Failed to load feed.");
        }

        if (active) {
          const incoming = Array.isArray(payload.data) ? payload.data : [];
          setHasMore(incoming.length >= limit);
          setPosts((current) => {
            if (page === 1) {
              return incoming;
            }

            const next = [...current];
            for (const item of incoming) {
              if (!postIds.has(item.id)) {
                next.push(item);
              }
            }
            return next;
          });
          setError("");
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadFeed();

    return () => {
      active = false;
    };
  }, [page, limit, postIds]);

  useEffect(() => {
    if (!sentinelRef.current) {
      return undefined;
    }

    const node = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) {
          return;
        }

        if (loading || !hasMore) {
          return;
        }

        setPage((current) => current + 1);
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading]);

  async function handleLike(postId) {
    const response = await apiFetch("/api/post/like", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ postId }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.message || "Failed to like post.");
      return;
    }

    setPosts((current) =>
      current.map((post) => (post.id === postId ? payload.data : post))
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 text-white sm:px-6">
      <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.18),_transparent_30%),linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.96))] p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-light">
              TurfX Social
            </p>
            <h1 className="mt-3 text-4xl font-semibold">Community Feed</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Match highlights, player milestones, tournament updates, and manual
              posts all live in one sports-first feed.
            </p>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="mt-8 space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onLike={handleLike} />
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center">
          <div ref={sentinelRef} className="h-10 w-full">
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={loading || !hasMore}
              className="mx-auto block rounded-full border border-white/10 px-6 py-3 text-sm text-slate-200 transition hover:border-brand/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {!hasMore ? "You're all caught up" : loading ? "Loading..." : "Load More"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
