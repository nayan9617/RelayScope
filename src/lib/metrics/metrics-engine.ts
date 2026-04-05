import { useMetricsStore } from "@/store/metrics-store";

export class MetricsEngine {
  recordRelayEvent(relayUrl: string, firstEventLatencyMs: number | null) {
    useMetricsStore.getState().recordEvent(relayUrl, firstEventLatencyMs);
  }
}

export const metricsEngine = new MetricsEngine();