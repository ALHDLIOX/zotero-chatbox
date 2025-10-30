import type { SessionMessage } from "./session";

export interface SendChatOptions {
  messages: SessionMessage[];
  signal?: AbortSignal;
  onToken?: (token: string) => void;
}

export interface ChatResponse {
  completion: string;
}

/**
 * Skeleton provider client. A complete implementation with streaming support
 * will follow in Phase 2 (T011–T012).
 */
export async function sendChat(
  _options: SendChatOptions,
): Promise<ChatResponse> {
  throw new Error("sendChat not implemented yet");
}
