import PostDetailClient from "@/components/social/post-detail-client";

export default async function PostDetailPage({ params }) {
  const { id } = await params;

  return <PostDetailClient postId={id} />;
}
