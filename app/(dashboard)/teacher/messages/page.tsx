import MessagePanel from "@/components/messages/MessagePanel";

export default function TeacherMessagesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Messages</h1>
        <p className="mt-2 text-slate-600">Message students enrolled in your courses.</p>
      </div>
      <MessagePanel role="TEACHER" />
    </div>
  );
}
