"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type LiveSession } from "@/lib/api";

interface UseLiveSessionsReturn {
  sessions: LiveSession[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createSession: (data: {
    title: string;
    courseId: string;
    start: string;
    end?: string;
    link: string;
    hostLink?: string;
  }) => Promise<LiveSession>;
  trackAttendance: (sessionId: string, action: "join" | "leave") => Promise<{ status: string; durationMinutes?: number; message: string }>;
}

export function useLiveSessions(): UseLiveSessionsReturn {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.live.list();
      setSessions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch live sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  const createSession = useCallback(
    async (data: { title: string; courseId: string; start: string; end?: string; link: string; hostLink?: string }) => {
      const session = await api.live.create(data);
      setSessions((prev) => [...prev, session]);
      return session;
    },
    [],
  );

  const trackAttendance = useCallback(
    (sessionId: string, action: "join" | "leave") =>
      api.live.attendance.track(sessionId, action),
    [],
  );

  return { sessions, loading, error, refetch, createSession, trackAttendance };
}
