"use client";

import { useEffect } from "react";

import { eventProcessor } from "@/lib/events/event-processor";
import { metricsEngine } from "@/lib/metrics/metrics-engine";
import { DEFAULT_RELAYS } from "@/lib/relay/types";
import { relayManager } from "@/lib/relay/relay-manager";

export function RelayConnectionController() {
  useEffect(() => {
    relayManager.connectAll(DEFAULT_RELAYS);

    const initialFilter = {
      since: Math.floor(Date.now() / 1000) - 60 * 60,
    };

    relayManager.subscribeKind1({
      ...initialFilter,
    }, ({ relayUrl, event, firstEventLatencyMs, receivedAt }) => {
      metricsEngine.recordRelayEvent(relayUrl, firstEventLatencyMs);
      eventProcessor.ingest({
        relayUrl,
        event,
        firstEventLatencyMs,
        receivedAt,
        filter: initialFilter,
      });
    });

    return () => {
      relayManager.destroy();
    };
  }, []);

  return null;
}