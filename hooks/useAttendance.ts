"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type AttendanceRecord } from "@/lib/api";

interface UseAttendanceReturn {
  records: AttendanceRecord[];
  loading: boolean;
  error: string | null;
  refetch: (courseId?: string) => Promise<void>;
  markAttendance: (data: { studentId: string; courseId: string; status: string; date?: string }) => Promise<AttendanceRecord>;
  updateAttendance: (id: string, status: "PRESENT" | "ABSENT") => Promise<AttendanceRecord>;
}

export function useAttendance(courseId?: string): UseAttendanceReturn {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (cId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.attendance.list(cId ?? courseId);
      setRecords(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch attendance");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  const markAttendance = useCallback(
    async (data: { studentId: string; courseId: string; status: string; date?: string }) => {
      const record = await api.attendance.create(data);
      setRecords((prev) => [...prev, record]);
      return record;
    },
    [],
  );

  const updateAttendance = useCallback(async (id: string, status: "PRESENT" | "ABSENT") => {
    const updated = await api.attendance.update(id, status);
    setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  }, []);

  return { records, loading, error, refetch, markAttendance, updateAttendance };
}
