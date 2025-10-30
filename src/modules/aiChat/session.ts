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
