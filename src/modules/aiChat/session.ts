export type ChatRole = "system" | "user" | "assistant";

export interface SessionMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
}

export interface ChatUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface ChatResult {
  text: string;
  usage?: ChatUsage;
  raw?: unknown;
}

export type SessionStatus = "idle" | "sending" | "streaming" | "stopped";

export interface SessionContextState {
  hasFulltext: boolean;
  hasPageMap: boolean;
  /**
   * Raw document text combined from relevant attachments.
   * Undefined when no context is available.
   */
  documentText?: string;
  /**
   * Attachment IDs that contributed to the current context.
   * Used to skip redundant re-hydration.
   */
  attachmentIDs: number[];
}

export interface SessionState {
  status: SessionStatus;
  messages: SessionMessage[];
  context: SessionContextState;
  lastResult?: ChatResult;
}

const sessions = new Map<string, SessionState>();

const defaultContext: SessionContextState = {
  hasFulltext: false,
  hasPageMap: false,
  documentText: undefined,
  attachmentIDs: [],
};

export function createEmptySession(): SessionState {
  return {
    status: "idle",
    messages: [],
    context: { ...defaultContext },
  };
}

export function getSession(sessionId: string): SessionState | undefined {
  return sessions.get(sessionId);
}

export function setSession(sessionId: string, state: SessionState): void {
  sessions.set(sessionId, state);
}

export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function ensureSession(sessionId: string): SessionState {
  let session = getSession(sessionId);
  if (!session) {
    session = createEmptySession();
    sessions.set(sessionId, session);
  }
  return session;
}

export function updateSession(
  sessionId: string,
  updater: (state: SessionState) => SessionState | void,
): SessionState {
  const current = ensureSession(sessionId);
  const result = updater(current);
  const nextState = result ? result : current;
  sessions.set(sessionId, nextState);
  return nextState;
}

export function appendMessage(
  sessionId: string,
  message: SessionMessage,
): SessionState {
  return updateSession(sessionId, (state) => {
    return {
      ...state,
      messages: [...state.messages, message],
    };
  });
}

export function replaceMessages(
  sessionId: string,
  messages: SessionMessage[],
): SessionState {
  return updateSession(sessionId, (state) => ({
    ...state,
    messages: [...messages],
  }));
}

export function setSessionStatus(
  sessionId: string,
  status: SessionStatus,
): SessionState {
  return updateSession(sessionId, (state) => ({
    ...state,
    status,
  }));
}

export function setSessionContext(
  sessionId: string,
  context: Partial<SessionContextState>,
): SessionState {
  return updateSession(sessionId, (state) => ({
    ...state,
    context: {
      ...state.context,
      ...context,
    },
  }));
}

export function setLastResult(
  sessionId: string,
  result: ChatResult | undefined,
): SessionState {
  return updateSession(sessionId, (state) => ({
    ...state,
    lastResult: result,
  }));
}

export function clearMessages(sessionId: string): SessionState {
  return updateSession(sessionId, (state) => ({
    ...state,
    messages: [],
    lastResult: undefined,
    status: "idle",
  }));
}

export function updateMessage(
  sessionId: string,
  messageId: string,
  updater: (message: SessionMessage) => SessionMessage,
): SessionState {
  return updateSession(sessionId, (state) => {
    let updated = false;
    const messages = state.messages.map((message) => {
      if (message.id === messageId) {
        updated = true;
        return updater(message);
      }
      return message;
    });
    if (!updated) {
      return state;
    }

    return {
      ...state,
      messages,
    };
  });
}

export function removeMessage(
  sessionId: string,
  messageId: string,
): SessionState {
  return updateSession(sessionId, (state) => ({
    ...state,
    messages: state.messages.filter((message) => message.id !== messageId),
  }));
}
