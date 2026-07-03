"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CourseOption = { id: string; title: string };

type AssignmentType = "ASSIGNMENT" | "QUIZ" | "MID_SEMESTER" | "EXAM";

const TYPE_CONFIG: Record<AssignmentType, { label: string; max: number; description: string }> = {
  ASSIGNMENT: {
    label: "Assignment",
    max: 10,
    description: "Student submits via the app. Total 10 marks split equally across all assignments.",
  },
  QUIZ: {
    label: "Quiz",
    max: 10,
    description: "10 marks total. Done online (student submits) or in person (you enter scores manually).",
  },
  MID_SEMESTER: {
    label: "Mid-Semester",
    max: 15,
    description: "15 marks total. Done online or in person.",
  },
  EXAM: {
    label: "Exam",
    max: 60,
    description: "60 marks total. Done online or in person.",
  },
};

export default function TeacherAssignmentCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [type, setType] = useState<AssignmentType>("ASSIGNMENT");
  const [totalMarks, setTotalMarks] = useState<number>(10);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => {
        setCourses(data || []);
        if (data?.length > 0) setCourseId(data[0].id);
      });
  }, []);

  // Auto-set totalMarks when type changes
  function handleTypeChange(newType: AssignmentType) {
    setType(newType);
    setTotalMarks(TYPE_CONFIG[newType].max);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !courseId || !dueDate) {
      setMessage("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, instructions, courseId, dueDate, type, totalMarks }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Could not create assignment.");
      } else {
        router.push("/teacher/assignments");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const config = TYPE_CONFIG[type];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Create Assessment</h1>
        <p className="mt-2 text-slate-600">
          Create an assignment, quiz, mid-semester, or exam for your students.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

        {/* Type selector */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">Assessment type</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(TYPE_CONFIG) as AssignmentType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className={`rounded-2xl border p-4 text-left transition ${
                  type === t
                    ? "border-[#1d6d58] bg-emerald-50 ring-1 ring-[#1d6d58]"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className="font-semibold text-slate-800 text-sm">{TYPE_CONFIG[t].label}</p>
                <p className="text-xs text-[#1d6d58] font-bold mt-1">{TYPE_CONFIG[t].max} marks</p>
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-500">{config.description}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Title <span className="text-red-500">*</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-[#1d6d58] focus:outline-none"
              placeholder={`e.g. ${config.label} 1`}
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Course <span className="text-red-500">*</span>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:border-[#1d6d58] focus:outline-none"
            >
              <option value="">Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="space-y-2 text-sm font-medium text-slate-700 block">
          Instructions / description
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-[#1d6d58] focus:outline-none resize-none"
            placeholder="What should students do or prepare for this assessment?"
          />
        </label>

        <div className="grid gap-6 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Due date <span className="text-red-500">*</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-[#1d6d58] focus:outline-none"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700">
            Total marks (out of)
            <input
              type="number"
              min={1}
              step={1}
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value))}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-[#1d6d58] focus:outline-none"
            />
            <p className="text-xs text-slate-400">
              This is your own grading scale (e.g. out of 100). The system converts it to the {config.max}-mark category weight automatically.
            </p>
          </label>
        </div>

        {courses.length === 0 && (
          <p className="text-sm text-orange-700">Create a course first before adding assessments.</p>
        )}

        {message && (
          <p className="text-sm text-red-600">{message}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || courses.length === 0}
            className="rounded-xl bg-[#1d6d58] px-6 py-3 text-sm font-semibold text-white hover:bg-[#124e40] disabled:opacity-50 transition"
          >
            {isSubmitting ? "Publishing…" : "Publish assessment"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/teacher/assignments")}
            className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
