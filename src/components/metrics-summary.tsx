"use client";

import { useMemo } from "react";

import { useMetricsStore } from "@/store/metrics-store";

export function MetricsSummary() {
  const byRelay = useMetricsStore((state) => state.byRelay);

  const metrics = useMemo(
    () => Object.values(byRelay).sort((a, b) => b.eventsReceived - a.eventsReceived),
    [byRelay],
  );

  return (
    <section className="rounded-2xl border border-white/15 bg-slate-950/60 p-5 shadow-2xl backdrop-blur">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cyan-100">Metrics Snapshot</h2>
        <span className="text-xs uppercase tracking-wide text-slate-400">events + latency</span>
      </header>

      <div className="space-y-3">
        {metrics.length === 0 ? (
          <p className="rounded-lg border border-white/10 bg-slate-900/75 p-3 text-sm text-slate-400">
            Waiting for events.
          </p>
        ) : (
          metrics.map((metric) => (
            <article
              key={metric.relayUrl}
              className="grid grid-cols-[1.5fr_repeat(3,minmax(0,1fr))] gap-3 rounded-lg border border-white/10 bg-slate-900/75 px-4 py-3 text-sm"
            >
              <p className="truncate font-medium text-slate-100">{metric.relayUrl}</p>
              <p className="text-slate-300">events: {metric.eventsReceived}</p>
              <p className="text-slate-300">avg latency: {Math.round(metric.averageLatencyMs)}ms</p>
              <p className="text-slate-300">throughput: {metric.throughputEps}/s</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}