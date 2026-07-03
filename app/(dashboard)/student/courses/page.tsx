"use client";

import { useEffect, useState } from "react";

type Course = {
  id: string;
  title: string;
  instructor: string;
  students: number;
  status: string;
  enrolled: boolean;
};

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadCourses() {
      const response = await fetch("/api/courses");
      const data = await response.json();
      setCourses(data);
      setLoading(false);
    }
    loadCourses();
    (async () => {
      try {
        const res = await fetch("/api/admin/registration");
        const json = await res.json();
        setRegistrationOpen(json.open ?? true);
      } catch {
        setRegistrationOpen(true);
      }
    })();
  }, []);

  async function handleEnroll(courseId: string) {
    if (registrationOpen === false) {
      setMessage("Registration is closed. You cannot enroll at this time.");
      return;
    }

    const response = await fetch(`/api/courses/${courseId}`, {
      method: "POST",
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Enrollment failed");
      return;
    }

    setCourses((current) =>
      current.map((course) =>
        course.id === courseId
          ? { ...course, enrolled: true, students: course.students + 1 }
          : course
      )
    );
    setMessage(`You are enrolled in ${data.title}.`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Browse Courses</h1>
        <p className="mt-2 text-slate-600">Enroll in published courses and see your active classes once registration is complete.</p>
      </div>

      {message ? <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : null}

      {loading ? (
        <div className="p-8 text-slate-500">Loading courses…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.length > 0 ? (
            courses.map((course) => (
              <div key={course.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{course.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">Instructor: {course.instructor}</p>
                  </div>
                  <span className="rounded-xl bg-slate-100 px-3 py-1 text-sm text-slate-700">{course.status}</span>
                </div>
                <p className="mt-4 text-sm text-slate-500">Enrolled learners: {course.students}</p>
                <button
                  disabled={course.enrolled || registrationOpen === false}
                  onClick={() => handleEnroll(course.id)}
                  className={`mt-4 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white ${(course.enrolled || registrationOpen === false) ? "bg-slate-300 cursor-not-allowed" : "bg-[#1d6d58] hover:bg-[#124e40]"}`}
                >
                  {course.enrolled ? "Enrolled" : registrationOpen === false ? "Registration closed" : "Enroll"}
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-slate-500">
              No published courses available yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
