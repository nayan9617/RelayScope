import { create } from "zustand";

import type { RelayEventEnvelope } from "@/lib/events/types";

type EventStoreState = {
  events: RelayEventEnvelope[];
  debugMode: boolean;
  totalEvents: number;
  duplicateEvents: number;
  duplicateByRelay: Record<string, number>;
  seenEventRelay: Record<string, string[]>;
  pushEvent: (payload: RelayEventEnvelope) => void;
  setDebugMode: (enabled: boolean) => void;
  hydrateFromSnapshot: (snapshot: Pick<EventStoreState, "events" | "totalEvents" | "duplicateEvents" | "duplicateByRelay" | "seenEventRelay">) => void;
};

export const useEventStore = create<EventStoreState>((set) => ({
  events: [],
  debugMode: true,
  totalEvents: 0,
  duplicateEvents: 0,
  duplicateByRelay: {},
  seenEventRelay: {},
  pushEvent: (payload) => {
    set((state) => ({
      totalEvents: state.totalEvents + 1,
      duplicateEvents:
        state.seenEventRelay[payload.event.id] && !state.seenEventRelay[payload.event.id].includes(payload.relayUrl)
          ? state.duplicateEvents + 1
          : state.duplicateEvents,
      duplicateByRelay:
        state.seenEventRelay[payload.event.id] && !state.seenEventRelay[payload.event.id].includes(payload.relayUrl)
          ? {
              ...state.duplicateByRelay,
              [payload.relayUrl]: (state.duplicateByRelay[payload.relayUrl] ?? 0) + 1,
            }
          : state.duplicateByRelay,
      seenEventRelay: {
        ...state.seenEventRelay,
        [payload.event.id]: Array.from(
          new Set([...(state.seenEventRelay[payload.event.id] ?? []), payload.relayUrl]),
        ),
      },
      events: [payload, ...state.events].slice(0, 300),
    }));
  },
  setDebugMode: (enabled) => {
    set({ debugMode: enabled });
  },
  hydrateFromSnapshot: (snapshot) => {
    set(snapshot);
  },
}));