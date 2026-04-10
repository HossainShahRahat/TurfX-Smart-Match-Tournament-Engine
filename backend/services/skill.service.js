function roundSkill(value) {
  return Number(value.toFixed(2));
}

export function calculateSkillRating({
  totalGoals = 0,
  totalMatches = 0,
  averagePeerRating = 0,
  peerRatingCount = 0,
}) {
  const safeGoals = Number.isFinite(totalGoals) ? totalGoals : 0;
  const safeMatches = Number.isFinite(totalMatches) ? totalMatches : 0;
  const safePeerAverage = Number.isFinite(averagePeerRating) ? averagePeerRating : 0;
  const safePeerCount = Number.isFinite(peerRatingCount) ? peerRatingCount : 0;

  if (safeGoals < 0 || safeMatches < 0 || safePeerAverage < 0 || safePeerCount < 0) {
    return 0;
  }

  if (safeMatches === 0 && safePeerCount === 0) {
    return 0;
  }

  const goalImpact = safeMatches > 0 ? Math.min((safeGoals / safeMatches) * 4, 10) : 0;
  const peerWeight = safePeerCount > 0 ? 0.75 : 0;
  const goalWeight = safePeerCount > 0 ? 0.25 : 1;
  const skillRating = safePeerAverage * peerWeight + goalImpact * goalWeight;

  return roundSkill(skillRating);
}

export function recalculatePlayerSkill(player) {
  return calculateSkillRating({
    totalGoals: player.totalGoals,
    totalMatches: player.totalMatches,
    averagePeerRating: player.averagePeerRating,
    peerRatingCount: player.peerRatingCount,
  });
}
