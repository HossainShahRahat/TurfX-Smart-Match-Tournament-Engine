"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api-client";

export default function PostDetailClient({ postId }) {
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPost() {
      const response = await apiFetch(`/api/post/${postId}`, {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        if (active) {
          setError(payload.message || "Failed to load post.");
        }
        return;
      }

      if (active) {
        setPost(payload.data);
      }
    }

    loadPost();

    return () => {
      active = false;
    };
  }, [postId]);

  async function handleSubmit(event) {
    event.preventDefault();

    const response = await apiFetch("/api/comment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        postId,
        text: comment,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.message || "Failed to add comment.");
      return;
    }

    setPost((current) =>
      current
        ? {
            ...current,
            comments: payload.data.comments,
            commentsCount: payload.data.commentsCount,
          }
        : current
    );
    setComment("");
    setError("");
  }

  if (error && !post) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 text-white sm:px-6">
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-100">
          {error}
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 text-white sm:px-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
          Loading post...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 text-white sm:px-6">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/30">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-light">
          {post.type.replaceAll("_", " ")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold">{post.title}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">{post.content}</p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">Comments</h2>

          <form onSubmit={handleSubmit} className="mt-4">
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Add your comment"
              className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-brand/40"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              {error ? <p className="text-sm text-rose-200">{error}</p> : <span />}
              <button
                type="submit"
                className="rounded-full border border-white/10 px-5 py-2 text-sm text-slate-100 transition hover:border-brand/40 hover:bg-brand/10"
              >
                Post Comment
              </button>
            </div>
          </form>

          <div className="mt-6 space-y-3">
            {(post.comments || []).map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{item.authorName || "User"}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
