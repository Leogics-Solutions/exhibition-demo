export type Attachment = {
  id: string;
  url: string;
  mimeType?: string;
  fileName?: string;
  file?: File; // Store the actual File object for upload
};

export type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  isStreaming?: boolean;
};
