"use client";

import { useEventStore } from "@/store/event-store";
import { useMetricsStore } from "@/store/metrics-store";
import { useRelayStore } from "@/store/relay-store";

const downloadBlob = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const toCsv = (rows: Array<Record<string, string | number>>) => {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const csvRows = [headers.join(",")];

  rows.forEach((row) => {
    const values = headers.map((header) => {
      const raw = String(row[header] ?? "");
      const escaped = raw.replaceAll('"', '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  });

  return csvRows.join("\n");
};

export function ExportControls() {
  const logs = useRelayStore((state) => state.logs);
  const relays = useRelayStore((state) => state.relays);
  const metricsByRelay = useMetricsStore((state) => state.byRelay);
  const events = useEventStore((state) => state.events);

  const exportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      relays,
      logs,
      metricsByRelay,
      events,
    };

    downloadBlob("relayscope-telemetry.json", JSON.stringify(payload, null, 2), "application/json");
  };

  const exportCsv = () => {
    const rows = Object.values(metricsByRelay).map((metric) => {
      const relay = relays[metric.relayUrl];
      return {
        relayUrl: metric.relayUrl,
        status: relay?.status ?? "unknown",
        successCount: relay?.successCount ?? 0,
        failureCount: relay?.failureCount ?? 0,
        retryCount: relay?.retryCount ?? 0,
        eventsReceived: metric.eventsReceived,
        averageLatencyMs: Math.round(metric.averageLatencyMs),
        throughputEps: metric.throughputEps,
      };
    });

    downloadBlob("relayscope-metrics.csv", toCsv(rows), "text/csv");
  };

  return (
    <section className="rounded-2xl border border-white/15 bg-slate-950/60 p-5 shadow-2xl backdrop-blur">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-cyan-100">Export Telemetry</h2>
        <p className="mt-1 text-xs text-slate-400">Download captured logs, relay states, and metrics for offline debugging.</p>
      </header>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={exportJson}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          Export JSON
        </button>

        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg border border-cyan-300/50 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-950/50"
        >
          Export CSV
        </button>
      </div>
    </section>
  );
}