/** Session facade: typed entry-point for chat sessions.
 *
 * Purpose:
 * - Provide a single public surface for session state access across the app
 * - Centralize type exports (SessionState, SessionMessage, etc.)
 * - Offer helpers that resolve pane props into scoped sessions
 *
 * Dependencies:
 * - sessionStore: in-memory storage and immutable updates
 * - sessionScope: computation of sessionId/scopeKey per Zotero pane
 *
 * Invariants:
 * - Callers outside the session package import from this module instead of sessionStore/sessionScope.
 * - resolveSessionForPane() always uses scoped sessions, resetting state when the scope key changes.
 */
import {
  appendMessage,
  clearMessages,
  ensureSession,
  getSession,
  removeMessage,
  replaceMessages,
  setLastResult,
  setSessionContext,
  setSessionStatus,
  updateMessage,
  type ChatResult,
  type ChatUsage,
  type ChatRole,
  type SessionContextState,
  type SessionMessage,
  type SessionState,
  type SessionStatus,
} from "./sessionStore";
import { resolveSessionAndScope } from "./sessionScope";

/** Chat session role type for exported session messages. */
export type { ChatRole } from "./sessionStore";

/** Message shape stored in chat sessions. */
export type { SessionMessage } from "./sessionStore";

/** Usage telemetry associated with a chat completion. */
export type { ChatUsage } from "./sessionStore";

/** Final chat result snapshot stored alongside a session. */
export type { ChatResult } from "./sessionStore";

/** High-level status flag for chat sessions (idle/sending/streaming/stopped). */
export type { SessionStatus } from "./sessionStore";

/** Context metadata and cached document text for a session. */
export type { SessionContextState } from "./sessionStore";

/** Complete chat session state stored in memory. */
export type { SessionState } from "./sessionStore";

/** Result of resolving a sessionId/scopeKey pair for the current pane. */
export type SessionResolution = ReturnType<typeof resolveSessionAndScope>;

/**
 * Resolve or create a scoped session for a given Zotero reader/item pane.
 *
 * @param props Pane hook arguments provided by Zotero.
 * @param doc Pane document used to derive window/scope information.
 * @param currentSessionId Optional current session id for detecting changes.
 * @param currentScopeKey Optional current scope key for detecting changes.
 * @returns Session id/scope metadata and the ensured SessionState (if any).
 */
export function resolveSessionForPane(
  props: _ZoteroTypes.ItemPaneManagerSection.SectionHookArgs,
  doc: Document,
  currentSessionId?: string,
  currentScopeKey?: string,
): SessionResolution {
  return resolveSessionAndScope(props, doc, currentSessionId, currentScopeKey);
}

/**
 * Ensure a session exists for the given id.
 *
 * @param sessionId Target chat session identifier.
 * @returns Live SessionState for the given id.
 */
export function ensureSessionExists(sessionId: string): SessionState {
  return ensureSession(sessionId);
}

/**
 * Get a snapshot of the current session state, if any.
 *
 * @param sessionId Target chat session identifier.
 * @returns SessionState when present, otherwise undefined.
 */
export function getSessionSnapshot(sessionId: string): SessionState | undefined {
  return getSession(sessionId);
}

/**
 * Remove all messages from a session and reset its status/lastResult.
 *
 * @param sessionId Target chat session identifier.
 * @returns Updated SessionState after clearing messages.
 */
export function clearSessionMessages(sessionId: string): SessionState {
  return clearMessages(sessionId);
}

/**
 * Append a message to the end of the session, ensuring the session exists.
 *
 * @param sessionId Target chat session identifier.
 * @param message Message to append.
 * @returns Updated SessionState after the append.
 */
export function appendSessionMessage(
  sessionId: string,
  message: SessionMessage,
): SessionState {
  return appendMessage(sessionId, message);
}

/**
 * Replace the entire message list for a session.
 *
 * @param sessionId Target chat session identifier.
 * @param messages New message array to set for the session.
 * @returns Updated SessionState after replacement.
 */
export function replaceSessionMessages(
  sessionId: string,
  messages: SessionMessage[],
): SessionState {
  return replaceMessages(sessionId, messages);
}

/**
 * Update status flag for a session.
 *
 * @param sessionId Target chat session identifier.
 * @param status New status value to set.
 * @returns Updated SessionState after status change.
 */
export function updateSessionStatus(
  sessionId: string,
  status: SessionStatus,
): SessionState {
  return setSessionStatus(sessionId, status);
}

/**
 * Patch the context metadata and cached document text for a session.
 *
 * @param sessionId Target chat session identifier.
 * @param context Partial context fields to merge into existing context.
 * @returns Updated SessionState after context update.
 */
export function updateSessionContext(
  sessionId: string,
  context: Partial<SessionContextState>,
): SessionState {
  return setSessionContext(sessionId, context);
}

/**
 * Record the last chat result associated with a session.
 *
 * @param sessionId Target chat session identifier.
 * @param result New result snapshot or undefined to clear it.
 * @returns Updated SessionState with the stored lastResult.
 */
export function setSessionLastResult(
  sessionId: string,
  result: ChatResult | undefined,
): SessionState {
  return setLastResult(sessionId, result);
}

/**
 * Update a single message within a session by id.
 *
 * @param sessionId Target chat session identifier.
 * @param messageId Message id to update.
 * @param updater Pure function that receives the current message and returns the new one.
 * @returns Updated SessionState after the message update.
 */
export function updateSessionMessage(
  sessionId: string,
  messageId: string,
  updater: (message: SessionMessage) => SessionMessage,
): SessionState {
  return updateMessage(sessionId, messageId, updater);
}

/**
 * Remove a message from a session by id.
 *
 * @param sessionId Target chat session identifier.
 * @param messageId Message id to remove.
 * @returns Updated SessionState after removal.
 */
export function removeSessionMessage(
  sessionId: string,
  messageId: string,
): SessionState {
  return removeMessage(sessionId, messageId);
}

