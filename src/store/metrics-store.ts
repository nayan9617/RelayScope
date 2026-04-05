import { create } from "zustand";

type RelayMetrics = {
  relayUrl: string;
  eventsReceived: number;
  averageLatencyMs: number;
  lastLatencyMs: number | null;
  throughputEps: number;
  latencySamples: number;
  recentEventTimestamps: number[];
  latencyHistory: Array<{ timestamp: number; latencyMs: number }>;
  throughputHistory: Array<{ timestamp: number; throughputEps: number }>;
};

type MetricsStoreState = {
  byRelay: Record<string, RelayMetrics>;
  recordEvent: (relayUrl: string, firstEventLatencyMs: number | null) => void;
  hydrateFromSnapshot: (snapshot: Record<string, RelayMetrics>) => void;
};

const createInitialMetrics = (relayUrl: string): RelayMetrics => ({
  relayUrl,
  eventsReceived: 0,
  averageLatencyMs: 0,
  lastLatencyMs: null,
  throughputEps: 0,
  latencySamples: 0,
  recentEventTimestamps: [],
  latencyHistory: [],
  throughputHistory: [],
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
    const throughputEps = Number((recentEventTimestamps.length / 10).toFixed(2));
    const latencySamples = firstEventLatencyMs === null ? current.latencySamples : current.latencySamples + 1;
    const averageLatencyMs =
      firstEventLatencyMs === null
        ? current.averageLatencyMs
        : (current.averageLatencyMs * current.latencySamples + firstEventLatencyMs) / latencySamples;

    const latencyHistory =
      firstEventLatencyMs === null
        ? current.latencyHistory
        : [...current.latencyHistory, { timestamp: now, latencyMs: firstEventLatencyMs }].slice(-120);

    const throughputHistory = [...current.throughputHistory, { timestamp: now, throughputEps }].slice(-120);

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
          throughputEps,
          latencyHistory,
          throughputHistory,
        },
      },
    }));
  },
  hydrateFromSnapshot: (snapshot) => {
    set({ byRelay: snapshot });
  },
}));

export type { RelayMetrics };