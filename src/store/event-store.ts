import { create } from "zustand";

import type { RelayEventEnvelope } from "@/lib/events/types";

type EventStoreState = {
  events: RelayEventEnvelope[];
  debugMode: boolean;
  pushEvent: (payload: RelayEventEnvelope) => void;
  setDebugMode: (enabled: boolean) => void;
};

export const useEventStore = create<EventStoreState>((set) => ({
  events: [],
  debugMode: true,
  pushEvent: (payload) => {
    set((state) => ({
      events: [payload, ...state.events].slice(0, 300),
    }));
  },
  setDebugMode: (enabled) => {
    set({ debugMode: enabled });
  },
}));