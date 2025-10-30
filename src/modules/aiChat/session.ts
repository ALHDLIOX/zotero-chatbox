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
