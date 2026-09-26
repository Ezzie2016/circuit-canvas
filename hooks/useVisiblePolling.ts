"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `callback` every `intervalMs` while the tab is visible.
 * Background tabs make no requests; when the tab becomes visible again the
 * callback runs immediately so the user never sees stale data.
 */
export function useVisiblePolling(callback: () => unknown, intervalMs: number, enabled = true) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => {
      void callbackRef.current();
    };
    const start = () => {
      if (!timer) timer = setInterval(tick, intervalMs);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else {
        tick();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs, enabled]);
}
