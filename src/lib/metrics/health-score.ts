type HealthScoreInput = {
  successRate: number;
  averageLatencyMs: number;
  uptimeRatio: number;
};

export const computeRelayHealthScore = ({
  successRate,
  averageLatencyMs,
  uptimeRatio,
}: HealthScoreInput): number => {
  const latencyFactor = averageLatencyMs > 0 ? 1 / averageLatencyMs : 0;

  const score = successRate * 0.5 + latencyFactor * 300 * 0.3 + uptimeRatio * 0.2;
  return Number(Math.max(0, Math.min(score * 100, 100)).toFixed(1));
};