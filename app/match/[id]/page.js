import LiveMatchView from "@/components/match/live-match-view";

export default async function MatchDetailPage({ params }) {
  const { id } = await params;

  return <LiveMatchView matchId={id} />;
}
