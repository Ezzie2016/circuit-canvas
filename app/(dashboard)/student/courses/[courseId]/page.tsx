"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Course = {
  id: string;
  title: string;
  instructor: string;
  students: number;
  status: string;
  enrolled: boolean;
  description?: string;
  meetingLink?: string;
  thumbnail?: string;
};

export default function StudentCourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadCourse() {
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
    (async () => {
      try {
        const res = await fetch("/api/admin/registration");
        const json = await res.json();
        setRegistrationOpen(json.open ?? true);
      } catch {
        setRegistrationOpen(true);
      }
    })();
  }, [courseId]);

  async function handleEnroll() {
    if (!course) return;

    const response = await fetch(`/api/courses/${course.id}`, {
      method: "POST",
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Enrollment failed");
      return;
    }

    setCourse((current) =>
      current ? { ...current, enrolled: true, students: current.students + 1 } : current
    );
    setMessage(`You are now enrolled in ${course.title}.`);
  }

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">{course.title}</h1>
        <p className="mt-2 text-slate-600">Instructor: {course.instructor}</p>
      </div>

      {message ? <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Course details</h2>
          <p className="mt-3 text-slate-600">Status: {course.status}</p>
          <p className="mt-2 text-slate-600">Enrolled: {course.students} students</p>
          {course.description ? <p className="mt-4 text-slate-600">{course.description}</p> : null}
          {course.meetingLink ? (
            <p className="mt-4 text-slate-600">
              Meeting link: <a href={course.meetingLink} className="text-slate-900 underline">{course.meetingLink}</a>
            </p>
          ) : null}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Next steps</h2>
          <p className="mt-3 text-slate-600">Check the course syllabus, upcoming live sessions, and active assignments in this course.</p>
          {!course.enrolled ? (
            <button
              onClick={handleEnroll}
              disabled={registrationOpen === false}
              className={`mt-4 rounded-xl px-5 py-3 text-sm font-semibold text-white ${registrationOpen === false ? "bg-slate-300 cursor-not-allowed" : "bg-[#1d6d58] hover:bg-[#124e40]"}`}
            >
              {registrationOpen === false ? "Registration closed" : "Enroll in course"}
            </button>
          ) : (
            <p className="mt-4 text-sm text-slate-600">You are enrolled in this course.</p>
          )}
        </div>
      </div>
    </div>
  );
}
