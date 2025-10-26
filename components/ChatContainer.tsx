import React, { useRef, useEffect, useState } from "react";
import ChatMessage from "./ChatMessage";
import { Message } from "./types";
import { COLORS } from "./constants";

interface ChatContainerProps {
  messages: Message[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export default function ChatContainer({
  messages,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false
}: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollThreshold = 200;

    // Show "Load More" button when scrolled near top
    if (scrollTop < scrollThreshold && hasMore && !isLoadingMore) {
      // User is near the top, could trigger load more
    }

    // Show scroll to bottom button when not at bottom
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollTop(!isNearBottom);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto pb-4 relative pt-16"
      onScroll={handleScroll}
    >
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Load More Button */}
        {/* {hasMore && (
          <div className="flex justify-center py-2">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="px-4 py-2 rounded-full border font-medium transition-colors disabled:opacity-50"
              style={{
                borderColor: COLORS.border,
                color: COLORS.text,
                backgroundColor: 'white'
              }}
              onMouseEnter={(e) => {
                if (!isLoadingMore) {
                  e.currentTarget.style.backgroundColor = COLORS.assistantBg;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoadingMore) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              {isLoadingMore ? 'Loading...' : 'Load More Messages'}
            </button>
          </div>
        )} */}

        {messages.map((message, index) => (
          <div key={message.id || index} className="flex gap-3">
            <ChatMessage message={message} />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollTop && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-8 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-opacity"
          style={{
            backgroundColor: COLORS.primary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.primaryDark;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.primary;
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
