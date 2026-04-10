export function calculateSkillRating({ totalGoals = 0, totalMatches = 0 }) {
  const safeGoals = Number.isFinite(totalGoals) ? totalGoals : 0;
  const safeMatches = Number.isFinite(totalMatches) ? totalMatches : 0;

  if (safeGoals < 0 || safeMatches < 0 || safeMatches === 0) {
    return 0;
  }

  const skillRating = (safeGoals * 2) / safeMatches;

  return Number(skillRating.toFixed(2));
}

export function recalculatePlayerSkill(player) {
  return calculateSkillRating({
    totalGoals: player.totalGoals,
    totalMatches: player.totalMatches,
  });
}
