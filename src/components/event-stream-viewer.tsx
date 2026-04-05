"use client";

import { useEventStore } from "@/store/event-store";

const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString();

export function EventStreamViewer() {
  const events = useEventStore((state) => state.events);
  const debugMode = useEventStore((state) => state.debugMode);
  const setDebugMode = useEventStore((state) => state.setDebugMode);
  const seenEventRelay = useEventStore((state) => state.seenEventRelay);
  const totalEvents = useEventStore((state) => state.totalEvents);
  const duplicateEvents = useEventStore((state) => state.duplicateEvents);

  return (
    <section className="rounded-2xl border border-white/15 bg-slate-950/60 p-5 shadow-2xl backdrop-blur">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cyan-100">Event Stream Viewer</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            duplicate rate: {totalEvents > 0 ? `${Math.round((duplicateEvents / totalEvents) * 100)}%` : "0%"}
          </span>
          <button
            type="button"
            onClick={() => setDebugMode(!debugMode)}
            className="rounded-md border border-cyan-300/40 px-3 py-1 text-xs text-cyan-100 transition hover:bg-cyan-950/40"
          >
            Debug {debugMode ? "ON" : "OFF"}
          </button>
        </div>
      </header>

      <div className="max-h-[32rem] space-y-3 overflow-auto pr-1">
        {events.length === 0 ? (
          <p className="rounded-lg border border-white/10 bg-slate-900/75 p-3 text-sm text-slate-400">
            No events yet. Apply filters and wait for relay traffic.
          </p>
        ) : (
          events.map((envelope) => (
            (() => {
              const duplicateSources = seenEventRelay[envelope.event.id] ?? [];
              const isDuplicate = duplicateSources.length > 1;

              return (
            <article
              key={`${envelope.relayUrl}-${envelope.event.id}`}
              className={`rounded-lg border p-3 ${isDuplicate ? "border-amber-300/60 bg-amber-950/20" : "border-white/10 bg-slate-900/75"}`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{envelope.relayUrl}</span>
                <span>{formatTime(envelope.receivedAt)}</span>
              </div>

              <p className="mt-2 text-xs text-slate-200">event id: {envelope.event.id}</p>
              <p className="mt-1 text-xs text-slate-300">author: {envelope.event.pubkey}</p>
              <p className="mt-1 text-xs text-slate-300">
                first event latency: {envelope.firstEventLatencyMs === null ? "-" : `${envelope.firstEventLatencyMs}ms`}
              </p>
              <p className="mt-1 text-xs text-slate-300">
                filters: {JSON.stringify(envelope.filter)}
              </p>
              {isDuplicate ? (
                <p className="mt-1 text-xs font-medium text-amber-300">
                  duplicate seen across relays: {duplicateSources.join(", ")}
                </p>
              ) : null}

              {debugMode ? (
                <pre className="mt-2 overflow-x-auto rounded-md bg-slate-950 p-2 text-xs text-cyan-100">
                  {JSON.stringify(envelope.event, null, 2)}
                </pre>
              ) : null}
            </article>
              );
            })()
          ))
        )}
      </div>
    </section>
  );
}