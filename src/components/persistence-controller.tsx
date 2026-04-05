"use client";

import { useEffect } from "react";

import { StorageService } from "@/lib/storage/storage-service";
import { useEventStore } from "@/store/event-store";
import { useMetricsStore } from "@/store/metrics-store";
import { useRelayStore } from "@/store/relay-store";

export function PersistenceController() {
  const metricsByRelay = useMetricsStore((state) => state.byRelay);
  const hydrateMetrics = useMetricsStore((state) => state.hydrateFromSnapshot);

  const events = useEventStore((state) => state.events);
  const totalEvents = useEventStore((state) => state.totalEvents);
  const duplicateEvents = useEventStore((state) => state.duplicateEvents);
  const duplicateByRelay = useEventStore((state) => state.duplicateByRelay);
  const seenEventRelay = useEventStore((state) => state.seenEventRelay);
  const hydrateEvents = useEventStore((state) => state.hydrateFromSnapshot);

  const relayLogs = useRelayStore((state) => state.logs);

  useEffect(() => {
    let mounted = true;

    const loadInitialState = async () => {
      const [metricsSnapshot, eventSnapshot] = await Promise.all([
        StorageService.loadLatestMetricsSnapshot(),
        StorageService.loadLatestEventSnapshot(),
      ]);

      if (!mounted) {
        return;
      }

      if (metricsSnapshot?.byRelay) {
        hydrateMetrics(metricsSnapshot.byRelay);
      }

      if (eventSnapshot) {
        hydrateEvents({
          events: eventSnapshot.events,
          totalEvents: eventSnapshot.totalEvents,
          duplicateEvents: eventSnapshot.duplicateEvents,
          duplicateByRelay: eventSnapshot.duplicateByRelay,
          seenEventRelay: eventSnapshot.seenEventRelay,
        });
      }
    };

    void loadInitialState();

    return () => {
      mounted = false;
    };
  }, [hydrateEvents, hydrateMetrics]);

  useEffect(() => {
    const timer = setInterval(() => {
      void StorageService.persistMetricsSnapshot(metricsByRelay);
      void StorageService.persistEventSnapshot({
        events,
        totalEvents,
        duplicateEvents,
        duplicateByRelay,
        seenEventRelay,
      });
      void StorageService.persistRelayLogs(relayLogs);
    }, 15_000);

    return () => {
      clearInterval(timer);
    };
  }, [metricsByRelay, events, totalEvents, duplicateEvents, duplicateByRelay, seenEventRelay, relayLogs]);

  return null;
}