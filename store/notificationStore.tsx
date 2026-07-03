"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { type Notification } from "@/lib/api";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
}

const NotificationContext = createContext<NotificationState>({
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
  markRead: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
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
    });

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  }, [notifications]);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  }, []);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, markRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationStore() {
  return useContext(NotificationContext);
}
