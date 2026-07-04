"use client";

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
      setCourses(Array.isArray(data) ? data : []);
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

    const response = await fetch(`/api/courses/${courseId}`, { method: "POST" });
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
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Browse Courses</h1>
        <p className="mt-2 text-slate-600">Enroll in published courses and see your active classes once registration is complete.</p>
      </div>

      {message ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>
      ) : null}

      {loading ? (
        <div className="p-8 text-slate-500">Loading courses…</div>
      ) : courses.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-slate-500">
          No published courses available yet.
        </div>
      ) : (
        <>
          {orderedLevels.map((level) => (
            <section key={level}>
              <h2 className="mb-4 text-lg font-semibold text-slate-700 flex items-center gap-2">
                <span className="rounded-lg bg-[#1d6d58] px-3 py-1 text-sm font-bold text-white">{level}</span>
                <span className="text-slate-400 text-sm font-normal">— {grouped[level].length} course{grouped[level].length !== 1 ? "s" : ""}</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {grouped[level].map((course) => (
                  <StudentCourseCard
                    key={course.id}
                    course={course}
                    registrationOpen={registrationOpen}
                    onEnroll={handleEnroll}
                  />
                ))}
              </div>
            </section>
          ))}

          {unassigned.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-700 flex items-center gap-2">
                <span className="rounded-lg bg-slate-400 px-3 py-1 text-sm font-bold text-white">General</span>
                <span className="text-slate-400 text-sm font-normal">— {unassigned.length} course{unassigned.length !== 1 ? "s" : ""}</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {unassigned.map((course) => (
                  <StudentCourseCard
                    key={course.id}
                    course={course}
                    registrationOpen={registrationOpen}
                    onEnroll={handleEnroll}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function StudentCourseCard({
  course,
  registrationOpen,
  onEnroll,
}: {
  course: Course;
  registrationOpen: boolean | null;
  onEnroll: (id: string) => void;
}) {
  const disabled = course.enrolled || registrationOpen === false;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
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
      <div className="flex-1">
        <h3 className="text-base font-semibold text-slate-900">{course.title}</h3>
        <p className="mt-1 text-sm text-slate-600">Instructor: {course.instructor}</p>
        <p className="mt-2 text-sm text-slate-500">{course.students} enrolled learner{course.students !== 1 ? "s" : ""}</p>
      </div>
      <button
        disabled={disabled}
        onClick={() => onEnroll(course.id)}
        className={`mt-4 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white ${disabled ? "bg-slate-300 cursor-not-allowed" : "bg-[#1d6d58] hover:bg-[#124e40]"}`}
      >
        {course.enrolled ? "Enrolled" : registrationOpen === false ? "Registration closed" : "Enroll"}
      </button>
    </div>
  );
}
