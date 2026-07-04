"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CLASS_LEVEL_ORDER = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

type Course = {
  id: string;
  title: string;
  code?: string | null;
  classLevel?: string | null;
  departmentName?: string | null;
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
      setCourses(Array.isArray(data) ? data : []);
    }
    loadCourses();
  }, []);

  const grouped: Record<string, Course[]> = {};
  const unassigned: Course[] = [];

  for (const course of courses) {
    if (course.classLevel) {
      if (!grouped[course.classLevel]) grouped[course.classLevel] = [];
      grouped[course.classLevel].push(course);
    } else {
      unassigned.push(course);
    }
  }

  const orderedLevels = CLASS_LEVEL_ORDER.filter((l) => grouped[l]?.length > 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Manage Courses</h1>
          <p className="mt-2 text-slate-600">View and update course offerings for your teaching roster.</p>
        </div>
        <Link href="/teacher/courses/create" className="rounded-xl bg-[#1d6d58] px-5 py-3 text-sm font-semibold text-white hover:bg-[#124e40]">
          Create course
        </Link>
      </div>

      {courses.length === 0 && (
        <p className="text-slate-500">No courses yet. Create your first course above.</p>
      )}

      {orderedLevels.map((level) => (
        <section key={level}>
          <h2 className="mb-4 text-lg font-semibold text-slate-700 flex items-center gap-2">
            <span className="rounded-lg bg-[#1d6d58] px-3 py-1 text-sm font-bold text-white">{level}</span>
            <span className="text-slate-400 text-sm font-normal">— {grouped[level].length} course{grouped[level].length !== 1 ? "s" : ""}</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {grouped[level].map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      ))}

      {unassigned.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-700 flex items-center gap-2">
            <span className="rounded-lg bg-slate-400 px-3 py-1 text-sm font-bold text-white">Unassigned</span>
            <span className="text-slate-400 text-sm font-normal">— {unassigned.length} course{unassigned.length !== 1 ? "s" : ""}</span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {unassigned.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap gap-1.5 mb-3">
        {course.classLevel && (
          <span className="rounded-lg bg-[#e6f2ee] px-2 py-0.5 text-xs font-semibold text-[#1d6d58]">{course.classLevel}</span>
        )}
        {course.departmentName && (
          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{course.departmentName}</span>
        )}
        {course.code && (
          <span className="rounded-lg bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700">{course.code}</span>
        )}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{course.title}</h3>
      <p className="mt-1 text-sm text-slate-500">{course.students} learner{course.students !== 1 ? "s" : ""}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={`/teacher/courses/${course.id}`} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
          View
        </Link>
        <Link href={`/teacher/courses/${course.id}/edit`} className="rounded-xl bg-[#1d6d58] px-4 py-2 text-sm font-semibold text-white hover:bg-[#124e40]">
          Edit
        </Link>
      </div>
    </div>
  );
}
