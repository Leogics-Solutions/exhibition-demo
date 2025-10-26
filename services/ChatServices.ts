import { APIReturnValue } from "@/components/constants";
import axios from "axios";

const generateURl = () =>{
    return `${process.env.NEXT_PUBLIC_HTTP}${process.env.NEXT_PUBLIC_URL}/api/v1/` 
}

const extractErrorMessage2 = (error: any): string => {
    let errorMsg = "An unexpected error occurred";
  
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
  
      // Handle validation errors (array format)
      if (Array.isArray(detail)) {
        const validationErrors = detail.map((err: any) => {
          if (err.msg && err.loc) {
            const field = err.loc[err.loc.length - 1]; // Get the field name
            return `${field}: ${err.msg}`;
          }
          return err.msg || "Validation error";
        });
        errorMsg = validationErrors.join(", ");
      }
      // Handle string error messages
      else if (typeof detail === 'string') {
        errorMsg = detail;
      }
      // Handle object error messages
      else if (typeof detail === 'object') {
        errorMsg = JSON.stringify(detail);
      }
    } else if (error.message) {
      errorMsg = error.message;
    }
  
    return errorMsg;
  };

export type MinimalAsset = {
    id: string;
    uri: string;
    mimeType?: string;
    fileName?: string;
    file?: File; // For browser File objects
  };

export const uploadAttachment = async (token: string | null, asset: MinimalAsset): Promise<APIReturnValue> => {
    try {
      // For browser environments with File object
      if (asset.file) {
        const formData = new FormData();
        formData.append('file', asset.file);

        const response = await axios.post(
          `${generateURl()}attachments/upload`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );

        return { success: true, msg: response.data };
      }

      // Fallback for React Native or other environments with URI
      const localUri = asset.uri;

      if (!localUri) {
        throw new Error('Invalid asset: no file or URI provided');
      }

      const { mimetype, extension } = getMimeType(localUri);
      const fileName = asset.fileName || localUri.split('/').pop() || `file${Math.floor(1000 + Math.random() * 9000)}.${extension}`;


      const formData = new FormData();
      formData.append('file', {
        uri: localUri,
        name: fileName,
        type: mimetype,
      } as any);

      const response = await axios.post(
        `${generateURl()}attachments/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      return { success: true, msg: response.data };
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.detail || error.message || 'Upload failed';
      console.error('Upload error:', errorMsg);
      return { success: false, msg: errorMsg };
    }
  };
  
  export const getMimeType = (uri: string): { mimetype: string, extension: string } => {
    const extension = uri.split('.').pop()?.toLowerCase();
    let mimetype = "";
  
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        mimetype = 'image/jpeg';
        break;
      case 'png':
        mimetype = 'image/png';
        break;
      case 'heic':
        mimetype = 'image/heic';
        break;
      case 'gif':
        mimetype = 'image/gif';
        break;
      case 'webp':
        mimetype = 'image/webp';
        break;
      default:
        mimetype = 'application/octet-stream';
        break;
    }
  
    return {
      mimetype: mimetype,
      extension: extension || ""
    }
  };
  
  export const getRecentMessages = async (
    token: string | null,
    before?: string,
    limit: number = 20
  ): Promise<APIReturnValue> => {
    try {
      const queryParams = new URLSearchParams();
      if (before) queryParams.append('before', before);
      queryParams.append('limit', limit.toString());
  
      const response = await axios.get(`${generateURl()}messages?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      return { success: true, msg: response.data };
    } catch (error: any) {
      const errorMsg = extractErrorMessage2(error);
      console.error("error getting chat: ", errorMsg);
  
      return { success: false, msg: `${errorMsg}` };
    }
  };

export const connectAIStream = (
    token: string | null,
    payload: { message: string; attachmentIds: (string | undefined)[]; chatId: string },
    onChunk: (text: string) => void,
    onClose?: () => void,
    onError?: (err: any) => void
  ): Promise<WebSocket> => {

    return new Promise<WebSocket>((resolve, reject) => {
      try {
        const wsUrl = process.env.NEXT_PUBLIC_URL;

        if (!wsUrl) {
          const error = new Error("NEXT_PUBLIC_URL environment variable is not set");
          console.error("🚨 [WS] Configuration error:", error.message);
          onError?.(error);
          reject(error);
          return;
        }

        const url = `${process.env.NEXT_PUBLIC_WS}${wsUrl}/api/v1/ws/messages`;

        const socket = new WebSocket(url);
  
        // State
        let promiseSettled = false;       // whether this Promise has resolved/rejected
        let didRequestClose = false;      // whether client initiated close after [complete]
        let messageToSend = "";
  
        // Prepare message
        try {
          messageToSend = JSON.stringify({
            token: token ?? undefined,
            ...payload,
          });
  
        } catch (prepError) {
          console.error("🚨 [WS] Message preparation failed:", prepError);
          promiseSettled = true;
          reject(prepError);
          return;
        }
  
        // Connection timeout (for initial open)
        const connectionTimeout = setTimeout(() => {
          if (!promiseSettled) {
            console.error("⏰ [WS] Connection timeout");
            promiseSettled = true;
            try { socket.close(1006, "connect-timeout"); } catch {}
            reject(new Error("WebSocket connection timeout"));
          }
        }, 15000);
  
        socket.onopen = () => {
  
          clearTimeout(connectionTimeout);
  
          if (promiseSettled) {
            return;
          }
  
          try {
            socket.send(messageToSend);
            promiseSettled = true;
            resolve(socket); // caller gets the live socket
          } catch (sendError) {
            console.error("🚨 [WS] Send error:", sendError);
            promiseSettled = true;
            onError?.(sendError);
            reject(sendError);
          }
        };
  
        socket.onmessage = (event) => {
          const data = event.data;

          // Server error convention
          if (typeof data === "string" && data.includes("[error]")) {
            console.error("❌ [WS] Server error detected:", data);
            onError?.(new Error(`Server error: ${data}`));
            // proactively close to avoid dangling sockets (RN/iOS)
            try { socket.close(1011, "server-error"); } catch {}
            return;
          }

          // Terminal sentinel → close socket so onclose fires
          if (data === "[complete]") {
            didRequestClose = true;
            try { socket.close(1000, "complete"); } catch {}
            return;
          }

          // Normal chunk
          try {
            // Try to parse as JSON first to check for session_id
            let textContent = data;

            if (typeof data === "string") {
              try {
                const jsonData = JSON.parse(data);

                // Check if this is a session info message
                if (jsonData.current_session_id) {
                  // Pass session_id through onChunk with a special prefix
                  onChunk(`[SESSION_ID]:${jsonData.current_session_id}`);
                  return; // Don't display this as regular content
                }

                textContent = JSON.stringify(jsonData);
              } catch {
                // Not JSON, treat as regular text
                textContent = data;
              }
            } else {
              textContent = JSON.stringify(data);
            }

            onChunk(textContent);
          } catch (chunkError) {
            console.error("🧨 [WS] Chunk parse error:", chunkError);
            // keep stream alive; do not close
          }
        };
  
        socket.onerror = () => {
          clearTimeout(connectionTimeout);

          // Create a more descriptive error message
          let errorMessage = "WebSocket connection failed";

          // Check socket state to provide better context
          switch (socket.readyState) {
            case WebSocket.CONNECTING:
              errorMessage = "Failed to establish WebSocket connection. Check if the server is accessible.";
              break;
            case WebSocket.OPEN:
              errorMessage = "WebSocket connection error occurred during communication.";
              break;
            case WebSocket.CLOSING:
              errorMessage = "WebSocket connection error while closing.";
              break;
            case WebSocket.CLOSED:
              errorMessage = "WebSocket connection closed unexpectedly.";
              break;
          }

          console.error("🔥 [WS] Socket error occurred");
          console.error("🔥 [WS] URL:", url);
          console.error("🔥 [WS] Ready State:", socket.readyState, `(${['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][socket.readyState] || 'UNKNOWN'})`);
          console.error("🔥 [WS] Message:", errorMessage);

          const error = new Error(errorMessage);
          onError?.(error);

          // Ensure closure to trigger onclose even in flaky stacks
          try { socket.close(1011, "client-error"); } catch {}

          // Reject only if the promise hasn't resolved yet (e.g., failed to open/send)
          if (!promiseSettled) {
            promiseSettled = true;
            reject(error);
          }
        };
  
        socket.onclose = (ev) => {
          clearTimeout(connectionTimeout);
  
          // Normalize iOS behavior: 1006 sometimes appears for app-initiated close
          const normalish = ev.code === 1000 || (ev.code === 1006 && didRequestClose);
  
          if (!normalish && !didRequestClose) {
            // Unintended/abnormal close after being open
            const abnormalError = new Error(
              `WebSocket closed abnormally (${ev.code}): ${ev.reason || "no reason"}`
            );
            onError?.(abnormalError);
            // If we never resolved (e.g., closed during handshake), reject
            if (!promiseSettled) {
              promiseSettled = true;
              reject(abnormalError);
              return;
            }
          }
  
          // Finalization callback
          onClose?.();
        };
      } catch (outerError) {
        console.error("💥 [WS] Failed to initialize WebSocket");
        console.error("💥 [WS] Error:", outerError);
        onError?.(outerError);
        reject(outerError);
      }
    });
  };