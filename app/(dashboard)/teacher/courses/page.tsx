"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Course = {
  id: string;
  title: string;
  instructor: string;
  students: number;
  status: string;
};

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    async function loadCourses() {
      const response = await fetch("/api/courses");
      const data = await response.json();
      setCourses(data);
    }
    loadCourses();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Manage Courses</h1>
          <p className="mt-2 text-slate-600">View and update course offerings for your teaching roster.</p>
        </div>
        <Link href="/teacher/courses/create" className="rounded-xl bg-[#1d6d58] px-5 py-3 text-sm font-semibold text-white hover:bg-[#124e40]">
          Create course
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <div key={course.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">{course.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{course.instructor}</p>
            <p className="mt-3 text-sm text-slate-500">{course.students} learners</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={`/teacher/courses/${course.id}`} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
                View
              </Link>
              <Link href={`/teacher/courses/${course.id}/edit`} className="rounded-xl bg-[#1d6d58] px-4 py-2 text-sm font-semibold text-white hover:bg-[#124e40]">
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
