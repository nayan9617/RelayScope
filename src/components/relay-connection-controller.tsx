"use client";

import { useEffect } from "react";

import { DEFAULT_RELAYS } from "@/lib/relay/types";
import { relayManager } from "@/lib/relay/relay-manager";
import { useEventStore } from "@/store/event-store";
import { useMetricsStore } from "@/store/metrics-store";

export function RelayConnectionController() {
  const pushEvent = useEventStore((state) => state.pushEvent);
  const recordEvent = useMetricsStore((state) => state.recordEvent);

  useEffect(() => {
    relayManager.connectAll(DEFAULT_RELAYS);
    relayManager.subscribeKind1({
      since: Math.floor(Date.now() / 1000) - 60 * 60,
    }, ({ relayUrl, event, firstEventLatencyMs, receivedAt }) => {
      recordEvent(relayUrl, firstEventLatencyMs);
      pushEvent({
        relayUrl,
        event,
        firstEventLatencyMs,
        receivedAt,
        filter: {
          since: Math.floor(Date.now() / 1000) - 60 * 60,
        },
      });
    });

    return () => {
      relayManager.destroy();
    };
  }, [pushEvent, recordEvent]);

  return null;
}