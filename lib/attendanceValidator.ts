/**
 * Validates attendance records against minimum duration requirement
 * Students must attend for at least 60 minutes to be marked PRESENT
 */

const MINIMUM_DURATION_MINUTES = 60;

export function validateAttendanceDuration(durationMinutes: number | null): {
  valid: boolean;
  message: string;
} {
  if (durationMinutes === null) {
    return {
      valid: false,
      message: `Attendance duration not recorded. Minimum required: ${MINIMUM_DURATION_MINUTES} minutes.`,
    };
  }

  if (durationMinutes < MINIMUM_DURATION_MINUTES) {
    return {
      valid: false,
      message: `Student attended for ${durationMinutes} minutes. Minimum required: ${MINIMUM_DURATION_MINUTES} minutes.`,
    };
  }

  return {
    valid: true,
    message: `Student attended for ${durationMinutes} minutes (meets ${MINIMUM_DURATION_MINUTES} minute requirement).`,
  };
}

export function calculateAttendanceDuration(
  joinedAt: Date | string,
  leftAt: Date | string
): number {
  const joinTime = typeof joinedAt === "string" ? new Date(joinedAt) : joinedAt;
  const leaveTime = typeof leftAt === "string" ? new Date(leftAt) : leftAt;
  return Math.round((leaveTime.getTime() - joinTime.getTime()) / (1000 * 60));
}

export function autoMarkAttendance(durationMinutes: number | null): "PRESENT" | "ABSENT" {
  if (durationMinutes === null) return "ABSENT";
  return durationMinutes >= MINIMUM_DURATION_MINUTES ? "PRESENT" : "ABSENT";
}
