"use client";

import { useEffect, useState } from "react";

type Course = {
  id: string;
  title: string;
  instructor: string;
  teacherId: string;
  students: number;
  status: string;
};

type Teacher = {
  id: string;
  name: string;
  email: string;
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const [coursesRes, teachersRes] = await Promise.all([
        fetch("/api/courses"),
        fetch("/api/users?role=TEACHER"),
      ]);
      const [coursesData, teachersData] = await Promise.all([coursesRes.json(), teachersRes.json()]);
      setCourses(coursesData);
      setTeachers(teachersData);
    }
    loadData();
  }, []);

  async function handleTeacherChange(courseId: string, teacherId: string) {
    const response = await fetch(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not update instructor");
      return;
    }

    setCourses((current) =>
      current.map((course) =>
        course.id === courseId
          ? { ...course, instructor: data.instructor, teacherId: data.teacherId }
          : course
      )
    );
    setMessage(`Instructor updated for ${data.title}.`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Course Catalog</h1>
        <p className="mt-2 text-slate-600">Review published courses and reassign instructors when needed.</p>
      </div>

      {message ? <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <div key={course.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{course.status}</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">{course.title}</h2>
              </div>
              <span className="rounded-xl bg-slate-100 px-3 py-1 text-sm text-slate-600">{course.students} students</span>
            </div>

            <label className="mt-6 block text-sm text-slate-700">
              Instructor
              <select
                value={course.teacherId}
                onChange={(e) => handleTeacherChange(course.id, e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
              >
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
