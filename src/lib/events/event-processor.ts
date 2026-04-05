import type { RelayEventEnvelope } from "@/lib/events/types";
import { useEventStore } from "@/store/event-store";

export class EventProcessor {
  ingest(envelope: RelayEventEnvelope) {
    useEventStore.getState().pushEvent(envelope);
  }
}

export const eventProcessor = new EventProcessor();