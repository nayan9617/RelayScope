import { create } from "zustand";

type RelayMetrics = {
  relayUrl: string;
  eventsReceived: number;
  averageLatencyMs: number;
  lastLatencyMs: number | null;
  throughputEps: number;
  latencySamples: number;
  recentEventTimestamps: number[];
};

type MetricsStoreState = {
  byRelay: Record<string, RelayMetrics>;
  recordEvent: (relayUrl: string, firstEventLatencyMs: number | null) => void;
};

const createInitialMetrics = (relayUrl: string): RelayMetrics => ({
  relayUrl,
  eventsReceived: 0,
  averageLatencyMs: 0,
  lastLatencyMs: null,
  throughputEps: 0,
  latencySamples: 0,
  recentEventTimestamps: [],
});

export const useMetricsStore = create<MetricsStoreState>((set, get) => ({
  byRelay: {},
  recordEvent: (relayUrl, firstEventLatencyMs) => {
    const current = get().byRelay[relayUrl] ?? createInitialMetrics(relayUrl);
    const now = Date.now();

    const recentEventTimestamps = [...current.recentEventTimestamps, now].filter(
      (ts) => now - ts <= 10_000,
    );

    const eventCount = current.eventsReceived + 1;
    const latencySamples = firstEventLatencyMs === null ? current.latencySamples : current.latencySamples + 1;
    const averageLatencyMs =
      firstEventLatencyMs === null
        ? current.averageLatencyMs
        : (current.averageLatencyMs * current.latencySamples + firstEventLatencyMs) / latencySamples;

    set((state) => ({
      byRelay: {
        ...state.byRelay,
        [relayUrl]: {
          ...current,
          eventsReceived: eventCount,
          averageLatencyMs,
          lastLatencyMs: firstEventLatencyMs,
          latencySamples,
          recentEventTimestamps,
          throughputEps: Number((recentEventTimestamps.length / 10).toFixed(2)),
        },
      },
    }));
  },
}));