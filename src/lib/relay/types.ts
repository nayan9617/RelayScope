export type RelayStatus = "disconnected" | "connecting" | "connected" | "retrying";

export type RelayErrorType =
  | "timeout"
  | "rate_limit"
  | "connection_refused"
  | "unknown";

export type RelayErrorLog = {
  relayUrl: string;
  message: string;
  type: RelayErrorType;
  timestamp: number;
};

export type RelayConnectionState = {
  url: string;
  status: RelayStatus;
  retryCount: number;
  connectedAt: number | null;
  disconnectedAt: number | null;
  lastError: RelayErrorLog | null;
  successCount: number;
  failureCount: number;
  uptimeMs: number;
};

export const DEFAULT_RELAYS: string[] = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
  "wss://offchain.pub",
  "wss://purplepag.es",
  "wss://relay.nostr.band",
];