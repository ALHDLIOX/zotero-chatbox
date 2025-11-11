/** Message actions for assistant messages (UI-only thin wrappers). */
import { copyAssistantMessageById as copyAssistantMessageByIdService } from "../../../services/copyMessage";
import { createNoteFromAssistantMessage } from "../../../services/createNotes";

/** Minimal DOM entry contract exposed by MessageListController. */
export interface MessageDomLike {
  latestContent?: string;
}

/**
 * Copy an assistant message to clipboard, falling back to DOM content cache when needed.
 *
 * @param doc - Pane document used for clipboard fallback APIs.
 * @param sessionId - Active session identifier.
 * @param getEntry - Resolver returning the rendered message entry.
 * @param messageId - Target assistant message id.
 */
export async function copyAssistantMessageById(
  doc: Document,
  sessionId: string | undefined,
  getEntry: (id: string) => MessageDomLike | undefined,
  messageId: string,
): Promise<void> {
  const entry = getEntry(messageId);
  const fallback = entry?.latestContent ?? "";
  await copyAssistantMessageByIdService(sessionId, messageId, fallback);
}

/**
 * Render an assistant message into Zotero note HTML and create a linked note.
 *
 * @param doc - Pane document for DOM APIs.
 * @param sessionId - Active session identifier.
 * @param currentScopeKey - Reader scope cache key (item/attachment).
 * @param getEntry - Resolver returning the rendered message entry.
 * @param messageId - Target assistant message id.
 */
export async function addAssistantMessageToNotesById(
  doc: Document,
  sessionId: string | undefined,
  currentScopeKey: string | undefined,
  getEntry: (id: string) => MessageDomLike | undefined,
  messageId: string,
): Promise<void> {
  const entry = getEntry(messageId);
  if (!entry) return;
  const fallback = entry?.latestContent ?? "";
  await createNoteFromAssistantMessage(doc, sessionId, messageId, currentScopeKey, fallback);
}
