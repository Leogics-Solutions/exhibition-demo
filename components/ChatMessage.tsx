import React from "react";
import { Bot } from "lucide-react";
import MarkdownText from "./MarkdownText";
import TypewriterText from "./TypewriterText";
import { Message } from "./types";
import { COLORS } from "./constants";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end w-full">
        <div className="max-w-[80%] flex flex-col gap-2">
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-end">
              {message.attachments.map((att) => (
                <div key={att.id} className="relative">
                  <img
                    src={att.url}
                    alt={att.fileName || "attachment"}
                    className="max-w-xs max-h-60 object-cover rounded-lg border-2"
                    style={{ borderColor: COLORS.userBg }}
                  />
                </div>
              ))}
            </div>
          )}
          {/* Text content */}
          {message.content && (
            <div
              className="rounded-2xl px-4 py-3 text-white"
              style={{ backgroundColor: COLORS.userBg }}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant message
  const loadingMessages = [
    "thinking...",
    "pondering...",
    "processing...",
    "analyzing...",
    "contemplating...",
    "considering...",
    "reasoning...",
    "reflecting...",
  ];
  const randomLoadingMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];

  return (
    <div className="flex flex-col w-full gap-2">
      {/* Avatar and Name */}
      <div className="flex items-center gap-2">
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: COLORS.primary }}
        >
          <Bot size={18} />
        </div>
        <div className="font-semibold text-sm" style={{ color: COLORS.text }}>
          Assistant
        </div>
      </div>

      {/* Attachments */}
      {message.attachments && message.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 ml-10">
          {message.attachments.map((att) => (
            <div key={att.id} className="relative">
              <img
                src={att.url}
                alt={att.fileName || "attachment"}
                className="max-w-xs max-h-60 object-cover rounded-lg border"
                style={{ borderColor: COLORS.border }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Message content */}
      {message.content ? (
        <div
          className="rounded-2xl px-4 py-3 w-full"
          style={{
            color: COLORS.text
          }}
        >
          {message.isStreaming ? (
            <TypewriterText text={message.content} />
          ) : (
            <MarkdownText text={message.content} />
          )}
        </div>
      ) : (
        <div
          className="rounded-2xl px-4 py-3 w-full text-gray-400 animate-pulse"
        >
          {randomLoadingMessage}
        </div>
      )}
    </div>
  );
}
