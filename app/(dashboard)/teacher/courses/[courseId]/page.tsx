"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Course = {
  id: string;
  title: string;
  description?: string;
  instructor: string;
  students: number;
  meetingLink?: string;
  thumbnail?: string;
  status: string;
};

export default function TeacherCourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourse() {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        setCourse(null);
        setLoading(false);
        return;
      }
      const data: Course = await response.json();
      setCourse(data);
      setLoading(false);
    }
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-slate-500">Loading course details…</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8">
        <p className="text-slate-500">Course not found.</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8">
        <p className="text-slate-500">Course not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {course.thumbnail && (
        <div className="w-full overflow-hidden rounded-3xl border border-slate-200 shadow-sm" style={{ aspectRatio: "16/5" }}>
          <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover" />
        </div>
      )}
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">{course.title}</h1>
        <p className="mt-2 text-slate-600">Instructor: {course.instructor}</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-500">Status: {course.status}</p>
        {course.description ? <p className="mt-4 text-slate-600">{course.description}</p> : null}
        {course.meetingLink ? (
          <p className="mt-4 text-slate-600">
            Meeting link: <a href={course.meetingLink} className="text-slate-900 underline">{course.meetingLink}</a>
          </p>
        ) : null}
        <p className="mt-4 text-slate-600">This course currently has {course.students} enrolled learners.</p>
      </div>
    </div>
  );
}
