import type { StoredPortalState } from "../types";

export function readStoredPortalState(): StoredPortalState | null {
  try {
    const stored = window.localStorage.getItem("circuit-campus-portal");
    if (!stored) return null;
    return JSON.parse(stored) as StoredPortalState;
  } catch {
    return null;
  }
}