import Dexie, { type Table } from "dexie";

import type { RelayEventEnvelope } from "@/lib/events/types";
import type { RelayErrorLog } from "@/lib/relay/types";
import type { RelayMetrics } from "@/store/metrics-store";

export type MetricsSnapshotRecord = {
  id?: number;
  createdAt: number;
  byRelay: Record<string, RelayMetrics>;
};

export type EventSnapshotRecord = {
  id?: number;
  createdAt: number;
  events: RelayEventEnvelope[];
  totalEvents: number;
  duplicateEvents: number;
  duplicateByRelay: Record<string, number>;
  seenEventRelay: Record<string, string[]>;
};

export type RelayLogRecord = RelayErrorLog & {
  id?: number;
};

class RelayScopeDatabase extends Dexie {
  metricsSnapshots!: Table<MetricsSnapshotRecord, number>;
  eventSnapshots!: Table<EventSnapshotRecord, number>;
  relayLogs!: Table<RelayLogRecord, number>;

  constructor() {
    super("RelayScopeDB");

    this.version(1).stores({
      metricsSnapshots: "++id,createdAt",
      eventSnapshots: "++id,createdAt",
      relayLogs: "++id,timestamp,relayUrl,type",
    });
  }
}

export const relayScopeDb = new RelayScopeDatabase();

export const StorageService = {
  async persistMetricsSnapshot(byRelay: Record<string, RelayMetrics>) {
    await relayScopeDb.metricsSnapshots.add({
      createdAt: Date.now(),
      byRelay,
    });

    const count = await relayScopeDb.metricsSnapshots.count();
    if (count > 50) {
      const staleRecords = await relayScopeDb.metricsSnapshots.orderBy("createdAt").limit(count - 50).toArray();
      const staleIds = staleRecords.map((record) => record.id).filter((value): value is number => typeof value === "number");
      if (staleIds.length > 0) {
        await relayScopeDb.metricsSnapshots.bulkDelete(staleIds);
      }
    }
  },

  async persistEventSnapshot(snapshot: Omit<EventSnapshotRecord, "id" | "createdAt">) {
    await relayScopeDb.eventSnapshots.add({
      createdAt: Date.now(),
      ...snapshot,
    });

    const count = await relayScopeDb.eventSnapshots.count();
    if (count > 20) {
      const staleRecords = await relayScopeDb.eventSnapshots.orderBy("createdAt").limit(count - 20).toArray();
      const staleIds = staleRecords.map((record) => record.id).filter((value): value is number => typeof value === "number");
      if (staleIds.length > 0) {
        await relayScopeDb.eventSnapshots.bulkDelete(staleIds);
      }
    }
  },

  async persistRelayLogs(logs: RelayErrorLog[]) {
    if (logs.length === 0) {
      return;
    }

    const existingCount = await relayScopeDb.relayLogs.count();
    if (existingCount > 800) {
      const staleRecords = await relayScopeDb.relayLogs.orderBy("timestamp").limit(existingCount - 800).toArray();
      const staleIds = staleRecords.map((record) => record.id).filter((value): value is number => typeof value === "number");
      if (staleIds.length > 0) {
        await relayScopeDb.relayLogs.bulkDelete(staleIds);
      }
    }

    const latest = logs.slice(0, 40).map((log) => ({
      ...log,
    }));
    await relayScopeDb.relayLogs.bulkAdd(latest);
  },

  async loadLatestMetricsSnapshot() {
    return relayScopeDb.metricsSnapshots.orderBy("createdAt").last();
  },

  async loadLatestEventSnapshot() {
    return relayScopeDb.eventSnapshots.orderBy("createdAt").last();
  },
};