import { DebugConsole } from "@/components/debug-console";
import { EventStreamViewer } from "@/components/event-stream-viewer";
import { ExportControls } from "@/components/export-controls";
import { FailureRateDetector } from "@/components/failure-rate-detector";
import { MetricsDashboard } from "@/components/metrics-dashboard";
import { MetricsSummary } from "@/components/metrics-summary";
import { PersistenceController } from "@/components/persistence-controller";
import { RelayConnectionController } from "@/components/relay-connection-controller";
import { RelayRecommendationPanel } from "@/components/relay-recommendation-panel";
import { RelayOverview } from "@/components/relay-overview";
import { SubscriptionControls } from "@/components/subscription-controls";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(14,116,144,0.24),transparent_30%),radial-gradient(circle_at_60%_80%,rgba(51,65,85,0.35),transparent_45%)]" />
      <RelayConnectionController />
      <PersistenceController />

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-8">
        <header className="rounded-2xl border border-cyan-300/20 bg-slate-900/70 p-6 shadow-xl backdrop-blur">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">RelayScope</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-50 sm:text-4xl">
            Nostr Relay Monitoring and Debugging Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Multi-relay lifecycle visibility with reconnection tracking, health signals, and failure logs.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr]">
          <RelayOverview />
          <DebugConsole />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <FailureRateDetector />
          <ExportControls />
        </div>

        <SubscriptionControls />

        <RelayRecommendationPanel />

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1.8fr]">
          <MetricsSummary />
          <EventStreamViewer />
        </div>

        <MetricsDashboard />
      </main>
    </div>
  );
}
