import type { Assignment, LiveSession, Course, CalendarEvent } from "../../types";

export function buildCalendarEvents(
  assignments: Assignment[],
  liveSessions: LiveSession[],
  courses: Course[],
): CalendarEvent[] {
  const assignmentEvents = assignments.map((assignment) => {
    const course = courses.find((item) => item.id === assignment.courseId);
    return {
      id: `assignment-${assignment.id}`,
      courseId: assignment.courseId,
      courseTitle: course?.title || "Course",
      date: assignment.dueDate,
      label: assignment.title,
      type: "Assignment" as const,
    };
  });

  const liveClassEvents = liveSessions.map((session) => {
    const course = courses.find((item) => item.id === session.courseId);
    return {
      id: `live-${session.id}`,
      courseId: session.courseId,
      courseTitle: course?.title || "Course",
      date: session.startsAt,
      label: session.title,
      type: "Live Class" as const,
    };
  });

  return [...assignmentEvents, ...liveClassEvents].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}