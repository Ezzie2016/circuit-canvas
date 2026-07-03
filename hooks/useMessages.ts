"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type CourseMessage } from "@/lib/api";

interface UseMessagesReturn {
  messages: CourseMessage[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  sendMessage: (courseId: string, text: string) => Promise<CourseMessage>;
}

export function useMessages(): UseMessagesReturn {
  const [messages, setMessages] = useState<CourseMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.messages.list();
      setMessages(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  const sendMessage = useCallback(async (courseId: string, text: string) => {
    const msg = await api.messages.send(courseId, text);
    setMessages((prev) => [msg, ...prev]);
    return msg;
  }, []);

  return { messages, loading, error, refetch, sendMessage };
}
