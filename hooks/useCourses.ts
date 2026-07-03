"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type Course } from "@/lib/api";

interface UseCoursesReturn {
  courses: Course[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  enroll: (courseId: string) => Promise<void>;
  createCourse: (data: { title: string; description: string; meetingLink?: string; thumbnail?: string }) => Promise<Course>;
  updateCourse: (id: string, data: { title?: string; description?: string; meetingLink?: string; thumbnail?: string }) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
}

export function useCourses(): UseCoursesReturn {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.courses.list();
      setCourses(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  const enroll = useCallback(async (courseId: string) => {
    await api.courses.enroll(courseId);
    await refetch();
  }, [refetch]);

  const createCourse = useCallback(async (data: { title: string; description: string; meetingLink?: string; thumbnail?: string }) => {
    const course = await api.courses.create(data);
    setCourses((prev) => [...prev, course]);
    return course;
  }, []);

  const updateCourse = useCallback(async (id: string, data: { title?: string; description?: string; meetingLink?: string; thumbnail?: string }) => {
    const updated = await api.courses.update(id, data);
    setCourses((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  const deleteCourse = useCallback(async (id: string) => {
    await api.courses.delete(id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { courses, loading, error, refetch, enroll, createCourse, updateCourse, deleteCourse };
}
