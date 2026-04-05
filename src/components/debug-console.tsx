"use client";

import { useRelayStore } from "@/store/relay-store";

const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString();

export function DebugConsole() {
  const logs = useRelayStore((state) => state.logs);

  return (
    <section className="rounded-2xl border border-white/15 bg-slate-950/60 p-5 shadow-2xl backdrop-blur">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cyan-100">Debug Console</h2>
        <span className="text-xs uppercase tracking-wide text-slate-400">latest {logs.length}</span>
      </header>

      <div className="max-h-72 space-y-2 overflow-auto pr-1">
        {logs.length === 0 ? (
          <p className="rounded-lg border border-white/10 bg-slate-900/75 p-3 text-sm text-slate-400">
            No relay errors yet.
          </p>
        ) : (
          logs.map((log) => (
            <article
              key={`${log.relayUrl}-${log.timestamp}-${log.message}`}
              className="rounded-lg border border-white/10 bg-slate-900/75 p-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-100">{log.relayUrl}</p>
                <span className="text-slate-400">{formatTime(log.timestamp)}</span>
              </div>
              <p className="mt-1 text-rose-300">{log.type}</p>
              <p className="mt-1 text-slate-300">{log.message}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}