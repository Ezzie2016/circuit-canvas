"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AttendanceDetailsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/student/attendance-history");
  }, [router]);
  return null;
}
