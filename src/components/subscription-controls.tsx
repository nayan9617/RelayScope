"use client";

import { useState } from "react";

import { eventProcessor } from "@/lib/events/event-processor";
import { metricsEngine } from "@/lib/metrics/metrics-engine";
import { relayManager } from "@/lib/relay/relay-manager";
import type { Kind1SubscriptionFilter } from "@/lib/events/types";

const parseAuthors = (raw: string) =>
  raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

export function SubscriptionControls() {
  const [authorsInput, setAuthorsInput] = useState("");
  const [sinceMinutesInput, setSinceMinutesInput] = useState("60");
  const [untilMinutesInput, setUntilMinutesInput] = useState("");

  const applyFilters = () => {
    const now = Math.floor(Date.now() / 1000);
    const sinceMinutes = Number(sinceMinutesInput);
    const untilMinutes = Number(untilMinutesInput);
    const activeFilter: Kind1SubscriptionFilter = {
      authors: parseAuthors(authorsInput),
      since: Number.isFinite(sinceMinutes) && sinceMinutes > 0 ? now - sinceMinutes * 60 : undefined,
      until: Number.isFinite(untilMinutes) && untilMinutes > 0 ? now - untilMinutes * 60 : undefined,
    };

    relayManager.subscribeKind1(activeFilter, ({ relayUrl, event, firstEventLatencyMs, receivedAt }) => {
      metricsEngine.recordRelayEvent(relayUrl, firstEventLatencyMs);
      eventProcessor.ingest({
        relayUrl,
        event,
        firstEventLatencyMs,
        receivedAt,
        filter: activeFilter,
      });
    });
  };

  return (
    <section className="rounded-2xl border border-white/15 bg-slate-950/60 p-5 shadow-2xl backdrop-blur">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-cyan-100">Subscription Controls</h2>
        <p className="mt-1 text-xs text-slate-400">Kind 1 events with optional author and time filters.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-slate-300">
          Authors (comma-separated pubkeys)
          <input
            value={authorsInput}
            onChange={(event) => setAuthorsInput(event.target.value)}
            placeholder="npub/pubkey1,pubkey2"
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-300 transition focus:ring-2"
          />
        </label>

        <label className="text-xs text-slate-300">
          Since (minutes ago)
          <input
            value={sinceMinutesInput}
            onChange={(event) => setSinceMinutesInput(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-300 transition focus:ring-2"
          />
        </label>

        <label className="text-xs text-slate-300">
          Until (minutes ago)
          <input
            value={untilMinutesInput}
            onChange={(event) => setUntilMinutesInput(event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-300 transition focus:ring-2"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={applyFilters}
        className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
      >
        Apply Filters
      </button>
    </section>
  );
}