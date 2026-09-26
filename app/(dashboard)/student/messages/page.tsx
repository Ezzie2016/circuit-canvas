import MessagePanel from "@/components/messages/MessagePanel";

export default function StudentMessagesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold text-slate-900">Messages</h1>
        <p className="mt-2 text-slate-600">Message your teachers within each of your enrolled courses.</p>
      </div>
      <MessagePanel role="STUDENT" />
    </div>
  );
}
