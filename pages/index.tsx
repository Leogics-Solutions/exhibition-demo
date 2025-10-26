"use client";

import { useState, useRef, useCallback } from "react";
import Header from "../components/Header";
import ChatContainer from "../components/ChatContainer";
import ChatInput from "../components/ChatInput";
import { Message, Attachment } from "../components/types";
import {
  connectAIStream,
  uploadAttachment,
  getRecentMessages,
  MinimalAsset,
} from "../services/ChatServices";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");

  const socketRef = useRef<WebSocket | null>(null);
  const streamingMessageRef = useRef<Message | null>(null);

  // Get authentication token (you'll need to implement this based on your auth system)
  const getToken = () => {
    // TODO: Implement your auth token retrieval
    return null; // or localStorage.getItem('token')
  };

  // Clear chat handler
  const handleClearChat = () => {
    setMessages([]);
    setSessionId("");
  };

  // Load more messages
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const token = getToken();
    const oldestMessageId = messages[0]?.id;

    const result = await getRecentMessages(token, oldestMessageId, 20);

    if (result.success) {
      const newMessages = result.msg.messages || [];
      if (newMessages.length === 0) {
        setHasMore(false);
      } else {
        setMessages((prev) => [...newMessages, ...prev]);
      }
    } else {
      console.error("Failed to load messages:", result.msg);
    }

    setIsLoadingMore(false);
  }, [messages, hasMore, isLoadingMore]);

  // Upload attachments to server
  const uploadAttachmentsToServer = async (
    attachmentsToUpload: Attachment[]
  ): Promise<string[]> => {
    const token = getToken();
    const uploadedIds: string[] = [];

    for (const att of attachmentsToUpload) {
      if (att.id.startsWith("temp_")) {
        // This is a local file that needs to be uploaded
        const asset: MinimalAsset = {
          id: att.id,
          uri: att.url,
          mimeType: att.mimeType,
          fileName: att.fileName,
          file: att.file, // Pass the File object
        };

        const result = await uploadAttachment(token, asset);

        if (result.success) {
          uploadedIds.push(result.msg.attachment_id);
        } else {
          console.error("Failed to upload attachment:", result.msg);
        }
      } else {
        // Already uploaded
        uploadedIds.push(att.id);
      }
    }

    return uploadedIds;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;

    setIsUploading(true);

    // Upload attachments first
    const attachmentIds = await uploadAttachmentsToServer(attachments);

    // Create user message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: input,
      attachments: attachments,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachments([]);

    // Create placeholder for streaming assistant message
    const assistantMessage: Message = {
      id: `msg_${Date.now() + 1}`,
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    streamingMessageRef.current = assistantMessage;

    setIsUploading(false);

    // Connect to WebSocket for AI streaming
    const token = getToken();


    try {
      const socket = await connectAIStream(
        token,
        {
          message: input,
          attachmentIds: attachmentIds,
          chatId: sessionId || "",
        },
        (chunk: string) => {
          // Check if this is a session ID message
          if (chunk.startsWith("[SESSION_ID]:")) {
            const newSessionId = chunk.replace("[SESSION_ID]:", "");
            setSessionId(newSessionId);
            return;
          }

          // Update streaming message with new chunk
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: updated[lastIndex].content + chunk
              };
            }
            return updated;
          });
        },
        () => {
          // On close - mark streaming as complete
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
              updated[lastIndex] = {
                ...updated[lastIndex],
                isStreaming: false
              };
            }
            return updated;
          });
          socketRef.current = null;
        },
        (error: any) => {
          // On error
          console.error("WebSocket error:", error);
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: "Sorry, an error occurred while connecting to the AI service.",
                isStreaming: false
              };
            }
            return updated;
          });
        }
      );

      socketRef.current = socket;
    } catch (error) {
      console.error("Failed to connect to AI stream:", error);
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: "Sorry, failed to connect to the AI service.",
            isStreaming: false
          };
        }
        return updated;
      });
    }
  };

  return (
    <div className="relative flex flex-col h-screen w-full bg-white">
      <Header onClearChat={handleClearChat} />
      {messages.length === 0 ? (
        // Empty state - centered layout
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <h1 className="text-4xl font-bold mb-8" style={{ color: "#111827" }}>
            Stay protected with Scamurai
          </h1>
          <div className="w-full max-w-2xl">
            <ChatInput
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              isUploading={isUploading}
            />
          </div>
        </div>
      ) : (
        // Normal chat layout
        <div className="flex-1 flex flex-col h-full">
          <ChatContainer
            messages={messages}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
          />
          <ChatInput
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            isUploading={isUploading}
          />
        </div>
      )}
    </div>
  );
}
