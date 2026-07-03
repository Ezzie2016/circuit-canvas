"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { type Notification } from "@/lib/api";

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAllRead: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/notifications/stream");
    esRef.current = es;

    es.addEventListener("notification", (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as { type: string; notifications: Notification[] };
        if (Array.isArray(payload.notifications)) {
          setNotifications(payload.notifications);
        }
      } catch {
        // ignore malformed events
      }
      setLoading(false);
    });

    es.onerror = () => {
      setError("Connection to notification stream lost");
      setLoading(false);
      es.close();
    };

    return () => {
      es.close();
    };
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  return { notifications, unreadCount, loading, error, markAllRead };
}
