import { create } from "zustand";

import type { RelayConnectionState, RelayErrorLog, RelayStatus } from "@/lib/relay/types";

type RelayStoreState = {
  relays: Record<string, RelayConnectionState>;
  logs: RelayErrorLog[];
  setRelayStatus: (url: string, status: RelayStatus) => void;
  bumpRetry: (url: string) => void;
  markConnected: (url: string) => void;
  markDisconnected: (url: string, error?: RelayErrorLog) => void;
  incrementUptime: (url: string, deltaMs: number) => void;
  registerRelay: (url: string) => void;
};

const createInitialRelayState = (url: string): RelayConnectionState => ({
  url,
  status: "disconnected",
  retryCount: 0,
  connectedAt: null,
  disconnectedAt: null,
  lastError: null,
  successCount: 0,
  failureCount: 0,
  uptimeMs: 0,
});

export const useRelayStore = create<RelayStoreState>((set, get) => ({
  relays: {},
  logs: [],
  registerRelay: (url) => {
    const existing = get().relays[url];
    if (existing) {
      return;
    }
    set((state) => ({
      relays: {
        ...state.relays,
        [url]: createInitialRelayState(url),
      },
    }));
  },
  setRelayStatus: (url, status) => {
    const current = get().relays[url] ?? createInitialRelayState(url);
    set((state) => ({
      relays: {
        ...state.relays,
        [url]: {
          ...current,
          status,
        },
      },
    }));
  },
  bumpRetry: (url) => {
    const current = get().relays[url] ?? createInitialRelayState(url);
    set((state) => ({
      relays: {
        ...state.relays,
        [url]: {
          ...current,
          retryCount: current.retryCount + 1,
          status: "retrying",
        },
      },
    }));
  },
  markConnected: (url) => {
    const now = Date.now();
    const current = get().relays[url] ?? createInitialRelayState(url);
    set((state) => ({
      relays: {
        ...state.relays,
        [url]: {
          ...current,
          status: "connected",
          connectedAt: now,
          disconnectedAt: null,
          successCount: current.successCount + 1,
          retryCount: 0,
        },
      },
    }));
  },
  markDisconnected: (url, error) => {
    const now = Date.now();
    const current = get().relays[url] ?? createInitialRelayState(url);
    set((state) => ({
      relays: {
        ...state.relays,
        [url]: {
          ...current,
          status: "disconnected",
          disconnectedAt: now,
          lastError: error ?? current.lastError,
          failureCount: current.failureCount + 1,
        },
      },
      logs: error ? [error, ...state.logs].slice(0, 250) : state.logs,
    }));
  },
  incrementUptime: (url, deltaMs) => {
    const current = get().relays[url] ?? createInitialRelayState(url);
    if (current.status !== "connected") {
      return;
    }

    set((state) => ({
      relays: {
        ...state.relays,
        [url]: {
          ...current,
          uptimeMs: current.uptimeMs + deltaMs,
        },
      },
    }));
  },
}));