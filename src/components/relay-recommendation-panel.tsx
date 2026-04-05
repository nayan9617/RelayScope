"use client";

import { useEffect, useMemo, useState } from "react";

import { computeRelayHealthScore } from "@/lib/metrics/health-score";
import { relayManager } from "@/lib/relay/relay-manager";
import { useMetricsStore } from "@/store/metrics-store";
import { useRelayStore } from "@/store/relay-store";

const AUTO_FAILOVER_TARGET = 3;

type RankedRelay = {
  url: string;
  score: number;
  status: string;
};

export function RelayRecommendationPanel() {
  const [autoFailoverEnabled, setAutoFailoverEnabled] = useState(false);

  const relays = useRelayStore((state) => state.relays);
  const metricsByRelay = useMetricsStore((state) => state.byRelay);

  const rankedRelays = useMemo<RankedRelay[]>(() => {
    return Object.values(relays)
      .map((relay) => {
        const metric = metricsByRelay[relay.url];
        const successRate =
          relay.successCount + relay.failureCount > 0
            ? relay.successCount / (relay.successCount + relay.failureCount)
            : 0;
        const uptimeRatio = relay.uptimeMs / (relay.uptimeMs + relay.failureCount * 60_000 + 1);
        const score = computeRelayHealthScore({
          successRate,
          averageLatencyMs: metric?.averageLatencyMs ?? 0,
          uptimeRatio: Math.max(0, Math.min(uptimeRatio, 1)),
        });

        return {
          url: relay.url,
          score,
          status: relay.status,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [metricsByRelay, relays]);

  const topRelays = useMemo(
    () => rankedRelays.filter((relay) => relay.status === "connected").slice(0, AUTO_FAILOVER_TARGET),
    [rankedRelays],
  );

  useEffect(() => {
    if (!autoFailoverEnabled) {
      relayManager.setSubscriptionRelayScope();
      return;
    }

    const applyFailover = () => {
      const scopedRelays = topRelays.map((relay) => relay.url);
      relayManager.setSubscriptionRelayScope(scopedRelays);
    };

    applyFailover();
    const timer = setInterval(applyFailover, 15_000);

    return () => {
      clearInterval(timer);
      relayManager.setSubscriptionRelayScope();
    };
  }, [autoFailoverEnabled, topRelays]);

  return (
    <section className="rounded-2xl border border-white/15 bg-slate-950/60 p-5 shadow-2xl backdrop-blur">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cyan-100">Smart Relay Recommendations</h2>
        <button
          type="button"
          onClick={() => setAutoFailoverEnabled((value) => !value)}
          className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
            autoFailoverEnabled
              ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
              : "border border-cyan-300/50 text-cyan-100 hover:bg-cyan-950/50"
          }`}
        >
          Auto Failover: {autoFailoverEnabled ? "ON" : "OFF"}
        </button>
      </header>

      <p className="mb-3 text-xs text-slate-400">
        Ranked by weighted health score (success rate, latency, uptime). When auto failover is on, subscriptions are scoped to the best connected relays.
      </p>

      <div className="space-y-2">
        {rankedRelays.length === 0 ? (
          <p className="rounded-lg border border-white/10 bg-slate-900/75 p-3 text-sm text-slate-400">
            Waiting for relay telemetry.
          </p>
        ) : (
          rankedRelays.slice(0, 5).map((relay, index) => (
            <article
              key={relay.url}
              className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-lg border border-white/10 bg-slate-900/75 px-3 py-2 text-sm"
            >
              <p className="text-xs font-semibold text-cyan-200">#{index + 1}</p>
              <p className="truncate text-slate-100">{relay.url}</p>
              <p className="text-slate-300">{relay.score}</p>
              <p className={`${relay.status === "connected" ? "text-emerald-300" : "text-amber-300"}`}>
                {relay.status}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}