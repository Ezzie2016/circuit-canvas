"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type Assignment, type AssignmentDetail } from "@/lib/api";

interface UseAssignmentsReturn {
  assignments: Assignment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getDetail: (id: string) => Promise<AssignmentDetail>;
  createAssignment: (data: {
    title: string;
    instructions: string;
    dueDate: string;
    courseId: string;
    totalMarks?: number;
  }) => Promise<Assignment>;
}

export function useAssignments(): UseAssignmentsReturn {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.assignments.list();
      setAssignments(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch assignments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  const getDetail = useCallback((id: string) => api.assignments.get(id), []);

  const createAssignment = useCallback(
    async (data: { title: string; instructions: string; dueDate: string; courseId: string; totalMarks?: number }) => {
      const assignment = await api.assignments.create(data);
      setAssignments((prev) => [...prev, assignment]);
      return assignment;
    },
    [],
  );

  return { assignments, loading, error, refetch, getDetail, createAssignment };
}
