import { Relay } from "nostr-tools/relay";
import type { Filter } from "nostr-tools/filter";
import type { NostrEvent } from "nostr-tools/core";
import type { Subscription } from "nostr-tools/relay";

import { useRelayStore } from "@/store/relay-store";
import type { RelayConnectionState, RelayErrorLog, RelayErrorType } from "@/lib/relay/types";
import type { Kind1SubscriptionFilter } from "@/lib/events/types";

const BASE_RETRY_MS = 1_000;
const MAX_RETRY_MS = 30_000;

const classifyErrorType = (error: unknown): RelayErrorType => {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes("timeout")) {
    return "timeout";
  }
  if (message.includes("rate") || message.includes("429") || message.includes("throttle")) {
    return "rate_limit";
  }
  if (
    message.includes("refused") ||
    message.includes("econnrefused") ||
    message.includes("failed to fetch")
  ) {
    return "connection_refused";
  }
  return "unknown";
};

export class RelayManager {
  private relays = new Map<string, Relay>();
  private retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private subscriptions = new Map<string, Subscription>();
  private uptimeTicker: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;
  private activeFilter: Kind1SubscriptionFilter = {};
  private subscriptionStartedAtByRelay = new Map<string, number>();
  private firstEventSeenByRelay = new Set<string>();
  private onEventCallback:
    | ((payload: {
        relayUrl: string;
        event: NostrEvent;
        firstEventLatencyMs: number | null;
        receivedAt: number;
      }) => void)
    | null = null;

  public connectAll(urls: string[]) {
    const store = useRelayStore.getState();
    urls.forEach((url) => {
      store.registerRelay(url);
      this.connectRelay(url);
    });

    if (!this.uptimeTicker) {
      this.uptimeTicker = setInterval(() => {
        const relayEntries = Object.values(useRelayStore.getState().relays);
        relayEntries.forEach((relay: RelayConnectionState) => {
          if (relay.status === "connected") {
            useRelayStore.getState().incrementUptime(relay.url, 1000);
          }
        });
      }, 1000);
    }
  }

  public destroy() {
    this.destroyed = true;
    this.retryTimers.forEach((timer) => clearTimeout(timer));
    this.retryTimers.clear();

    if (this.uptimeTicker) {
      clearInterval(this.uptimeTicker);
      this.uptimeTicker = null;
    }

    this.subscriptions.forEach((sub) => sub.close("relay manager destroyed"));
    this.subscriptions.clear();
    this.relays.forEach((relay) => relay.close());
    this.relays.clear();
  }

  public getRelay(url: string): Relay | undefined {
    return this.relays.get(url);
  }

  public subscribeKind1(
    filter: Kind1SubscriptionFilter,
    onEvent: (payload: {
      relayUrl: string;
      event: NostrEvent;
      firstEventLatencyMs: number | null;
      receivedAt: number;
    }) => void,
  ) {
    this.activeFilter = filter;
    this.onEventCallback = onEvent;
    this.firstEventSeenByRelay.clear();

    this.subscriptions.forEach((sub) => sub.close("replaced by a new subscription"));
    this.subscriptions.clear();
    this.subscriptionStartedAtByRelay.clear();

    this.relays.forEach((relay, relayUrl) => {
      this.attachRelaySubscription(relayUrl, relay);
    });
  }

  private toNostrFilter(filter: Kind1SubscriptionFilter): Filter {
    return {
      kinds: [1],
      authors: filter.authors,
      since: filter.since,
      until: filter.until,
    };
  }

  private attachRelaySubscription(relayUrl: string, relay: Relay) {
    if (!this.onEventCallback) {
      return;
    }

    const nostrFilter = this.toNostrFilter(this.activeFilter);
    const startedAt = Date.now();
    this.subscriptionStartedAtByRelay.set(relayUrl, startedAt);

    const sub = relay.subscribe([nostrFilter], {
      onevent: (event) => {
        const isFirstEvent = !this.firstEventSeenByRelay.has(relayUrl);
        const firstEventLatencyMs = isFirstEvent
          ? Date.now() - (this.subscriptionStartedAtByRelay.get(relayUrl) ?? Date.now())
          : null;

        if (isFirstEvent) {
          this.firstEventSeenByRelay.add(relayUrl);
        }

        this.onEventCallback?.({
          relayUrl,
          event,
          firstEventLatencyMs,
          receivedAt: Date.now(),
        });
      },
    });

    this.subscriptions.set(relayUrl, sub);
  }

  private async connectRelay(url: string) {
    if (this.destroyed) {
      return;
    }

    const store = useRelayStore.getState();
    store.setRelayStatus(url, "connecting");

    try {
      const relay = await Relay.connect(url, {
        enablePing: true,
      });

      relay.onclose = () => {
        this.subscriptions.get(url)?.close("relay closed");
        this.subscriptions.delete(url);
        this.relays.delete(url);

        const error: RelayErrorLog = {
          relayUrl: url,
          message: "Relay closed connection",
          type: "unknown",
          timestamp: Date.now(),
        };
        useRelayStore.getState().markDisconnected(url, error);
        this.scheduleReconnect(url);
      };

      relay.onnotice = (message: string) => {
        if (message.toLowerCase().includes("rate")) {
          const error: RelayErrorLog = {
            relayUrl: url,
            message,
            type: "rate_limit",
            timestamp: Date.now(),
          };
          useRelayStore.getState().markDisconnected(url, error);
        }
      };

      this.relays.set(url, relay);
      store.markConnected(url);

      if (this.onEventCallback) {
        this.attachRelaySubscription(url, relay);
      }
    } catch (error) {
      const typedError: RelayErrorLog = {
        relayUrl: url,
        message: error instanceof Error ? error.message : String(error),
        type: classifyErrorType(error),
        timestamp: Date.now(),
      };

      store.markDisconnected(url, typedError);
      this.scheduleReconnect(url);
    }
  }

  private scheduleReconnect(url: string) {
    if (this.destroyed || this.retryTimers.has(url)) {
      return;
    }

    const store = useRelayStore.getState();
    store.bumpRetry(url);

    const relayState = store.relays[url];
    const retryCount = relayState?.retryCount ?? 1;
    const backoffMs = Math.min(BASE_RETRY_MS * 2 ** Math.max(retryCount - 1, 0), MAX_RETRY_MS);

    const timeout = setTimeout(() => {
      this.retryTimers.delete(url);
      this.connectRelay(url);
    }, backoffMs);

    this.retryTimers.set(url, timeout);
  }
}

export const relayManager = new RelayManager();