/**
 * Session state management for AI Chat
 */

/**
 * Message entity
 */
export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: number;
  id: string;
}

/**
 * Chat result entity
 */
export interface ChatResult {
  text: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  raw?: unknown;
}

/**
 * Document context information
 */
export interface DocumentContext {
  hasFulltext: boolean;
  hasPageMap: boolean;
}

/**
 * Session entity
 */
export interface Session {
  status: "idle" | "sending" | "streaming" | "stopped";
  messages: Message[];
  context: DocumentContext;
  lastResult?: ChatResult;
}

// In-memory session storage per reader tab
const sessions = new Map<string, Session>();

/**
 * Get the current session for a reader tab
 */
export function getSession(tabId: string): Session | null {
  return sessions.get(tabId) || null;
}

/**
 * Set/update the session for a reader tab
 */
export function setSession(tabId: string, session: Session): void {
  sessions.set(tabId, session);
}

/**
 * Clear messages but retain context for a reader tab
 */
export function clearMessages(tabId: string): void {
  const session = sessions.get(tabId);
  if (session) {
    session.messages = [];
    session.lastResult = undefined;
    session.status = "idle";
    sessions.set(tabId, session);
  }
}

/**
 * Remove the session for a reader tab (cleanup)
 */
export function removeSession(tabId: string): void {
  sessions.delete(tabId);
}

/**
 * Create a new session with empty state
 */
export function createSession(context: DocumentContext): Session {
  return {
    status: "idle",
    messages: [],
    context,
  };
}

/**
 * Add a message to the session
 */
export function addMessage(tabId: string, message: Message): void {
  const session = sessions.get(tabId);
  if (session) {
    session.messages.push(message);
    sessions.set(tabId, session);
  }
}

/**
 * Update session status
 */
export function updateStatus(tabId: string, status: Session["status"]): void {
  const session = sessions.get(tabId);
  if (session) {
    session.status = status;
    sessions.set(tabId, session);
  }
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
