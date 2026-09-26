type MessageBubbleProps = {
  senderName: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
};

export default function MessageBubble({ senderName, text, timestamp, isOwn }: MessageBubbleProps) {
  const time = new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl border px-4 py-3 ${
          isOwn ? "border-[#bfe3d5] bg-[#eaf7f1]" : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold text-slate-800">{senderName}</span>
          <span className="text-xs text-slate-400">{time}</span>
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
      </div>
    </div>
  );
}
