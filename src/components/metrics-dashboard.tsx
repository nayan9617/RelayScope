"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useMetricsStore } from "@/store/metrics-store";
import { useRelayStore } from "@/store/relay-store";

const formatTimeLabel = (timestamp: number) => new Date(timestamp).toLocaleTimeString();

export function MetricsDashboard() {
  const metricsByRelay = useMetricsStore((state) => state.byRelay);
  const relayByUrl = useRelayStore((state) => state.relays);

  const perRelayBars = Object.values(metricsByRelay).map((metric) => {
    const relay = relayByUrl[metric.relayUrl];
    const totalConnections = (relay?.successCount ?? 0) + (relay?.failureCount ?? 0);

    return {
      relay: metric.relayUrl.replace("wss://", ""),
      events: metric.eventsReceived,
      throughput: metric.throughputEps,
      failures: relay?.failureCount ?? 0,
      failureRate: totalConnections > 0 ? Number((((relay?.failureCount ?? 0) / totalConnections) * 100).toFixed(1)) : 0,
    };
  });

  const firstRelayMetrics = Object.values(metricsByRelay)[0];
  const latencyTrend = (firstRelayMetrics?.latencyHistory ?? []).map((entry) => ({
    time: formatTimeLabel(entry.timestamp),
    latency: Math.round(entry.latencyMs),
  }));

  return (
    <section className="rounded-2xl border border-white/15 bg-slate-950/60 p-5 shadow-2xl backdrop-blur">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-cyan-100">Metrics Dashboard</h2>
        <p className="mt-1 text-xs text-slate-400">Latency trend, event volume, and failure behavior.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-xl border border-white/10 bg-slate-900/70 p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Latency Over Time</p>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={latencyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="latency" stroke="#22d3ee" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="h-72 rounded-xl border border-white/10 bg-slate-900/70 p-3">
          <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Events and Failure Rates</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perRelayBars}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="relay" stroke="#94a3b8" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={58} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="events" fill="#22d3ee" name="Events" />
              <Bar dataKey="failureRate" fill="#fb7185" name="Failure %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}