"use client";

import { useEffect, useState } from "react";

type CourseOption = {
  id: string;
  title: string;
};

export default function TeacherAssignmentCreatePage() {
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      const response = await fetch("/api/courses");
      const data = await response.json();
      setCourses(data || []);
      if (data && data.length > 0) {
        setCourseId(data[0].id);
      }
    }

    loadCourses();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !courseId || !dueDate) {
      setMessage("Please fill in all assignment details.");
      return;
    }

    setIsSubmitting(true);
    const response = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, courseId, dueDate }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not create assignment.");
    } else {
      setMessage(`Assignment created: ${data.title}`);
      setTitle("");
      setDueDate("");
    }
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Create Assignment</h1>
        <p className="mt-2 text-slate-600">Publish a new assignment for your students to complete.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700">
            Assignment title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              placeholder="Enter assignment title"
            />
          </label>

          <label className="space-y-2 text-sm text-slate-700">
            Course
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="space-y-2 text-sm text-slate-700">
          Due date
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting || courses.length === 0}
          className="rounded-xl bg-[#1d6d58] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#124e40] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Publishing…" : "Publish assignment"}
        </button>

        {courses.length === 0 ? (
          <p className="text-sm text-orange-700">Create a course first before posting assignments.</p>
        ) : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      </form>
    </div>
  );
}
