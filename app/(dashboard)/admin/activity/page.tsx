"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Activity {
  id: string;
  type: string;
  description: string;
  user: string;
  timestamp: string;
  severity: string;
}

export default function RecentActivityPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActivity() {
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      if (!data.user || data.user.role !== "ADMIN") {
        router.push("/login");
        return;
      }

      try {
        const activityRes = await fetch("/api/activity");
        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setActivities(activityData);
        }
      } catch (error) {
        console.error("Failed to load activity:", error);
      } finally {
        setLoading(false);
      }
    }

    loadActivity();
  }, [router]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "success":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Link href="/admin" className="text-[#1d6d58] hover:underline mb-4 inline-block">
        ← Back to Dashboard
      </Link>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-[#1d6d58] mb-8">Recent System Activity</h1>

        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              No recent activity
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="bg-white p-6 rounded-lg shadow flex items-start gap-4">
                <div
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap ${getSeverityColor(
                    activity.severity
                  )}`}
                >
                  {activity.type}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800">{activity.description}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    By {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
