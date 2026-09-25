"use client";

import { useState, type FormEvent } from "react";

type MessageInputProps = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <form className="flex items-end gap-3" onSubmit={handleSubmit}>
      <textarea
        className="h-20 flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#1d6d58] focus:ring-2 focus:ring-[#1d6d58]/15"
        disabled={disabled}
        onChange={(event) => setText(event.target.value)}
        placeholder="Write a message…"
        value={text}
      />
      <button
        className="h-11 shrink-0 rounded-xl bg-[#1d6d58] px-5 text-sm font-semibold text-white transition hover:bg-[#124e40] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled || !text.trim()}
        type="submit"
      >
        Send
      </button>
    </form>
  );
}
