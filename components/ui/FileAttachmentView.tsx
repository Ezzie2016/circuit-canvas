import type { FileAttachment } from "../../types";
import { formatFileSize } from "../../lib/utils/files";

export function FileAttachmentView({ attachment }: { attachment: FileAttachment }) {
  return (
    <div className="mt-3 rounded-md border border-[#d8ddd2] bg-[#fbfcf8] p-3 text-sm">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <p className="font-semibold text-[#17211b]">{attachment.name}</p>
          <p className="mt-1 text-[#667068]">
            {attachment.type} • {formatFileSize(attachment.size)}
          </p>
        </div>
        <span className="rounded-full bg-[#eef1e9] px-3 py-1 text-xs font-semibold text-[#46534b]">
          Uploaded {attachment.uploadedAt}
        </span>
      </div>
    </div>
  );
}