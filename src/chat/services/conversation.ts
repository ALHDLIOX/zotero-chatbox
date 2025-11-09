/**
 * Conversation services: orchestrate send pipeline and read-only helpers.
 *
 * Purpose: provide a single entry to send user content with optional document
 * context, stream assistant tokens via ChatFlow, and expose an abort handle.
 * Dependencies: sessionStore for state mutation, documentContext for building
 * system context, ChatFlow for streaming lifecycle.
 * Invariants: controllers do not touch sessionStore directly; all mutations go
 * through this service. Callers receive UI-ready callbacks for user/assistant.
 */
import {
  appendMessage,
  ensureSession,
  getSession,
  type SessionMessage,
} from "../state/sessionStore";
import { buildContextMessage } from "./documentContext";
import { ChatFlow } from "./chatFlow";
import type { ChatResponse } from "../providers";

/** Callbacks to surface UI updates during a send run. */
export interface ConversationCallbacks {
  /** Called once after the user message is created and appended. */
  onUser?: (message: SessionMessage) => void;
  /** Called once when the assistant placeholder is created and appended. */
  onAssistant?: (message: SessionMessage) => void;
  /** Called for each streamed token, in order. */
  onToken?: (token: string) => void;
}

/**
 * Send a message with optional document context and stream assistant reply.
 *
 * @param sessionId Target chat session id.
 * @param content User-entered plain text.
 * @param callbacks UI hooks for user/assistant/token events.
 * @returns An object with the running promise and an abort handle.
 */
export function sendWithContext(
  sessionId: string,
  content: string,
  callbacks: ConversationCallbacks = {},
): { promise: Promise<ChatResponse>; abort: (reason?: unknown) => void; user: SessionMessage; context?: SessionMessage } {
  const text = (content || "").trim();
  if (!sessionId || !text) {
    return {
      promise: Promise.resolve({ completion: "", usage: undefined, raw: undefined }),
      abort: () => void 0,
      user: { id: "", role: "user", content: "", timestamp: Date.now() },
    };
  }

  // Append user message first and surface to UI.
  const user: SessionMessage = {
    id: `${Date.now()}-u`,
    role: "user",
    content: text,
    timestamp: Date.now(),
  };
  appendMessage(sessionId, user);
  try { callbacks.onUser?.(user); } catch {}

  // Optionally append system document context (not shown in chat UI).
  const context = buildContextMessage(sessionId);
  if (context) {
    appendMessage(sessionId, context);
  }

  // Start ChatFlow and proxy callbacks.
  const flow = new ChatFlow(sessionId);
  const promise = flow.start({
    onAssistant: (m) => { try { callbacks.onAssistant?.(m); } catch {} },
    onToken: (t) => { try { callbacks.onToken?.(t); } catch {} },
  });

  const abort = (reason?: unknown) => {
    try { flow.abort(reason); } catch {}
  };

  return { promise, abort, user, context };
}

/**
 * Get assistant message plain text from the session, if present.
 *
 * @param sessionId Target session id.
 * @param messageId Assistant message id to look up.
 * @returns Plain text content, or undefined when missing.
 */
export function getAssistantMessageText(
  sessionId: string,
  messageId: string,
): string | undefined {
  const session = ensureSession(sessionId) || getSession(sessionId);
  const m = session?.messages.find((x) => x.id === messageId && x.role === "assistant");
  const text = m?.content ?? "";
  return text || undefined;
}

