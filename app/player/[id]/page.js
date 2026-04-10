import PlayerProfileClient from "@/components/social/player-profile-client";

export default async function PublicPlayerPage({ params }) {
  const { id } = await params;

  return <PlayerProfileClient playerId={id} />;
}
