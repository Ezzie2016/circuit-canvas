"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type Submission } from "@/lib/api";

interface UseSubmissionsReturn {
  submissions: Submission[];
  loading: boolean;
  error: string | null;
  refetch: (assignmentId?: string) => Promise<void>;
  submit: (assignmentId: string, response: string, file?: File) => Promise<Submission>;
  grade: (data: { id: string; earnedMarks?: number | null; feedback?: string; assignmentId?: string }) => Promise<Submission>;
}

export function useSubmissions(assignmentId?: string): UseSubmissionsReturn {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (id?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.submissions.list(id ?? assignmentId);
      setSubmissions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch submissions");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  const submit = useCallback(async (aId: string, response: string, file?: File) => {
    const fd = new FormData();
    fd.append("assignmentId", aId);
    fd.append("response", response);
    if (file) fd.append("file", file);
    const result = await api.submissions.submit(fd);
    await refetch();
    return result;
  }, [refetch]);

  const grade = useCallback(
    async (data: { id: string; earnedMarks?: number | null; feedback?: string; assignmentId?: string }) => {
      const result = await api.submissions.grade(data);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === data.id ? { ...s, ...result } : s)),
      );
      return result;
    },
    [],
  );

  return { submissions, loading, error, refetch, submit, grade };
}
