import React, { useRef } from "react";
import { Send } from "lucide-react";
import { COLORS } from "./constants";
import { Attachment } from "./types";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  attachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  isUploading?: boolean;
}

export default function ChatInput({
  input,
  onInputChange,
  onSubmit,
  attachments = [],
  onAttachmentsChange,
  isUploading = false
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate image type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);

    // Create temporary attachment object
    const newAttachment: Attachment = {
      id: `temp_${Date.now()}`, // Temporary ID, will be replaced after upload
      url: previewUrl,
      mimeType: file.type,
      fileName: file.name,
      file: file, // Store the actual File object
    };

    onAttachmentsChange?.([...attachments, newAttachment]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    const filtered = attachments.filter(att => att.id !== id);
    onAttachmentsChange?.(filtered);
  };

  return (
    <div
      className="sticky bottom-0 bg-white"
      style={{ borderColor: COLORS.border }}
    >
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Image previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((att) => (
              <div key={att.id} className="relative group">
                <img
                  src={att.url}
                  alt={att.fileName || "attachment"}
                  className="w-20 h-20 object-cover rounded-lg border"
                  style={{ borderColor: COLORS.border }}
                />
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} className="flex gap-2 items-center">
          {/* Image upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border transition-colors"
            style={{
              borderColor: COLORS.border,
              color: COLORS.text,
            }}
            onMouseEnter={(e) => {
              if (!isUploading) {
                e.currentTarget.style.backgroundColor = COLORS.assistantBg;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Type your message..."
            disabled={isUploading}
            className="flex-1 px-4 py-3 border rounded-full focus:outline-none focus:ring-2 transition-all"
            style={{
              borderColor: COLORS.border,
              color: COLORS.text
            }}
            onFocus={(e) => {
              e.target.style.borderColor = COLORS.primary;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = COLORS.border;
            }}
          />
          <button
            type="submit"
            disabled={isUploading}
            className="w-10 h-10 rounded-full text-white transition-colors flex-shrink-0 disabled:opacity-50 flex items-center justify-center"
            style={{
              backgroundColor: COLORS.primary,
            }}
            onMouseEnter={(e) => {
              if (!isUploading) {
                e.currentTarget.style.backgroundColor = COLORS.primaryDark;
              }
            }}
            onMouseLeave={(e) => {
              if (!isUploading) {
                e.currentTarget.style.backgroundColor = COLORS.primary;
              }
            }}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
