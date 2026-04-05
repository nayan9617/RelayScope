"use client";

import { useEffect } from "react";

import { DEFAULT_RELAYS } from "@/lib/relay/types";
import { relayManager } from "@/lib/relay/relay-manager";

export function RelayConnectionController() {
  useEffect(() => {
    relayManager.connectAll(DEFAULT_RELAYS);

    return () => {
      relayManager.destroy();
    };
  }, []);

  return null;
}