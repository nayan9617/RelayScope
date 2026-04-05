# RelayScope

RelayScope is a developer-focused Nostr relay monitoring and debugging dashboard built with Next.js, TypeScript, Zustand, Recharts, Dexie, and nostr-tools.

## Current Feature Set

- Multi-relay connection manager
- Automatic reconnection with exponential backoff
- Global relay state tracking (connected, disconnected, retrying)
- Kind 1 event subscriptions with filters:
  - authors
  - since/until time windows
- Real-time metrics:
  - events received per relay
  - first-event latency
  - rolling throughput (events/sec)
  - success/failure counters
- Event deduplication across relays:
  - duplicate rate
  - duplicate-heavy relay detection
- Relay health score:
  - success rate weight
  - latency weight
  - uptime weight
- Debug tooling:
  - raw JSON event stream
  - source relay and timestamps
  - applied filter visibility
  - relay error logs
- IndexedDB persistence with Dexie:
  - metrics snapshots
  - event snapshots
  - relay logs

## Architecture

- `RelayManager` (`src/lib/relay/relay-manager.ts`)
  - relay lifecycle, reconnection, and subscriptions
- `MetricsEngine` (`src/lib/metrics/metrics-engine.ts`)
  - real-time metrics updates
- `EventProcessor` (`src/lib/events/event-processor.ts`)
  - event ingestion and dedup pipeline
- `StorageService` (`src/lib/storage/storage-service.ts`)
  - IndexedDB persistence and hydration
- Zustand stores (`src/store/*`)
  - relay, metrics, and event state containers

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Zustand
- nostr-tools
- Recharts
- Dexie.js

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Check

```bash
npm run lint
npm run build
```

Note: Recharts may log width/height warnings during static prerender in build output. The runtime dashboard renders correctly in the browser.

## Default Relays

Configured in `src/lib/relay/types.ts`:

- `wss://relay.damus.io`
- `wss://nos.lol`
- `wss://relay.primal.net`
- `wss://offchain.pub`
- `wss://purplepag.es`
- `wss://relay.nostr.band`

## Planned Enhancements

- Smart relay recommendation
- Auto failover routing
- JSON/CSV export
- Network interruption simulator
