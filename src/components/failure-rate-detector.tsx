"use client";

import { useMemo } from "react";

import { useRelayStore } from "@/store/relay-store";

export function FailureRateDetector() {
  const relays = useRelayStore((state) => state.relays);
  const logs = useRelayStore((state) => state.logs);

  const analysis = useMemo(() => {
    const relayEntries = Object.values(relays);

    const repeatedRetries = relayEntries.filter((relay) => relay.retryCount >= 3);
    const totalRateLimitErrors = logs.filter((log) => log.type === "rate_limit").length;
    const totalTimeoutErrors = logs.filter((log) => log.type === "timeout").length;
    const totalConnectionRefused = logs.filter((log) => log.type === "connection_refused").length;

    const relayFailureRows = relayEntries
      .map((relay) => {
        const total = relay.successCount + relay.failureCount;
        const failureRate = total > 0 ? Math.round((relay.failureCount / total) * 100) : 0;
        return {
          url: relay.url,
          retryCount: relay.retryCount,
          failureRate,
          failureCount: relay.failureCount,
        };
      })
      .sort((a, b) => b.failureRate - a.failureRate)
      .slice(0, 6);

    return {
      repeatedRetries,
      totalRateLimitErrors,
      totalTimeoutErrors,
      totalConnectionRefused,
      relayFailureRows,
    };
  }, [logs, relays]);

  return (
    <section className="rounded-2xl border border-white/15 bg-slate-950/60 p-5 shadow-2xl backdrop-blur">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cyan-100">Failure and Rate Limit Detection</h2>
        <span className="text-xs uppercase tracking-wide text-slate-400">
          {analysis.repeatedRetries.length} relays with repeated retries
        </span>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-lg border border-rose-300/30 bg-rose-950/20 p-3">
          <p className="text-xs text-rose-200">Rate Limit Errors</p>
          <p className="mt-1 text-xl font-semibold text-rose-100">{analysis.totalRateLimitErrors}</p>
        </article>

        <article className="rounded-lg border border-amber-300/30 bg-amber-950/20 p-3">
          <p className="text-xs text-amber-200">Timeout Errors</p>
          <p className="mt-1 text-xl font-semibold text-amber-100">{analysis.totalTimeoutErrors}</p>
        </article>

        <article className="rounded-lg border border-fuchsia-300/30 bg-fuchsia-950/20 p-3">
          <p className="text-xs text-fuchsia-200">Connection Refused</p>
          <p className="mt-1 text-xl font-semibold text-fuchsia-100">{analysis.totalConnectionRefused}</p>
        </article>
      </div>

      <div className="mt-4 space-y-2">
        {analysis.relayFailureRows.length === 0 ? (
          <p className="rounded-lg border border-white/10 bg-slate-900/75 p-3 text-sm text-slate-400">
            No relay failure patterns detected yet.
          </p>
        ) : (
          analysis.relayFailureRows.map((row) => (
            <article
              key={row.url}
              className="grid grid-cols-[1.3fr_repeat(3,minmax(0,1fr))] gap-3 rounded-lg border border-white/10 bg-slate-900/75 px-3 py-2 text-sm"
            >
              <p className="truncate text-slate-100">{row.url}</p>
              <p className="text-slate-300">failures: {row.failureCount}</p>
              <p className="text-slate-300">failure rate: {row.failureRate}%</p>
              <p className={`${row.retryCount >= 3 ? "text-rose-300" : "text-slate-300"}`}>
                retries: {row.retryCount}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}