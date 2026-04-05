"use client";

import { useMemo } from "react";

import { computeRelayHealthScore } from "@/lib/metrics/health-score";
import { useRelayStore } from "@/store/relay-store";
import { useMetricsStore } from "@/store/metrics-store";

const statusClasses: Record<string, string> = {
  connected: "bg-emerald-400",
  connecting: "bg-amber-400",
  retrying: "bg-yellow-400",
  disconnected: "bg-rose-400",
};

const formatUptime = (uptimeMs: number) => {
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const formatSuccessRate = (successCount: number, failureCount: number) => {
  const total = successCount + failureCount;
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((successCount / total) * 100)}%`;
};

export function RelayOverview() {
  const relays = useRelayStore((state) => state.relays);
  const metricsByRelay = useMetricsStore((state) => state.byRelay);

  const relayList = useMemo(
    () => Object.values(relays).sort((a, b) => a.url.localeCompare(b.url)),
    [relays],
  );

  return (
    <section className="rounded-2xl border border-white/15 bg-slate-950/60 p-5 shadow-2xl backdrop-blur">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cyan-100">Relay Overview</h2>
        <span className="text-xs uppercase tracking-wide text-slate-400">
          {relayList.length} configured
        </span>
      </header>

      <div className="space-y-3">
        {relayList.map((relay) => {
          const relayMetric = metricsByRelay[relay.url];
          const successRate =
            relay.successCount + relay.failureCount > 0
              ? relay.successCount / (relay.successCount + relay.failureCount)
              : 0;
          const uptimeRatio = relay.uptimeMs / (relay.uptimeMs + relay.failureCount * 60_000 + 1);
          const score = computeRelayHealthScore({
            successRate,
            averageLatencyMs: relayMetric?.averageLatencyMs ?? 0,
            uptimeRatio: Math.max(0, Math.min(uptimeRatio, 1)),
          });

          return (
          <article
            key={relay.url}
            className="grid grid-cols-[1.2fr_repeat(5,minmax(0,1fr))] items-center gap-3 rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${statusClasses[relay.status] ?? "bg-slate-500"}`}
                />
                <p className="truncate font-medium text-slate-100">{relay.url}</p>
              </div>
              <p className="mt-1 text-xs text-slate-400">status: {relay.status}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Success</p>
              <p className="font-semibold text-emerald-300">{relay.successCount}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Failures</p>
              <p className="font-semibold text-rose-300">{relay.failureCount}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Retries</p>
              <p className="font-semibold text-amber-300">{relay.retryCount}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Uptime / Success Rate</p>
              <p className="font-semibold text-cyan-200">
                {formatUptime(relay.uptimeMs)} / {formatSuccessRate(relay.successCount, relay.failureCount)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Latency / Score</p>
              <p className="font-semibold text-sky-200">
                {Math.round(relayMetric?.averageLatencyMs ?? 0)}ms / {score}
              </p>
            </div>
          </article>
          );
        })}
      </div>
    </section>
  );
}