import type { NostrEvent } from "nostr-tools/core";

export type Kind1SubscriptionFilter = {
  authors?: string[];
  since?: number;
  until?: number;
};

export type RelayEventEnvelope = {
  relayUrl: string;
  event: NostrEvent;
  receivedAt: number;
  firstEventLatencyMs: number | null;
  filter: Kind1SubscriptionFilter;
};