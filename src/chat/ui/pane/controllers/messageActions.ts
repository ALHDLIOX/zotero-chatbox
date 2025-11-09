/** Message actions for assistant messages. */
import { getSession } from "../../../state/sessionStore";
import { copyText } from "../../../services/clipboard";
import { renderNoteHtml } from "../../../render/note/block";
import { createNotes } from "../../../services/createNotes";

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
  const session = sessionId ? getSession(sessionId) : undefined;
  const message = session?.messages.find((m) => m.id === messageId);
  const entry = getEntry(messageId);
  const content = message?.content ?? entry?.latestContent ?? "";
  if (!content.trim()) return;
  await copyText(content);
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
  const session = sessionId ? getSession(sessionId) : undefined;
  const message = session?.messages.find((item) => item.id === messageId);
  const raw = message?.content ?? entry?.latestContent ?? "";
  if (!raw || !raw.trim()) return;
  const html = renderNoteHtml(raw, doc);

  await createNotes(doc, html, currentScopeKey);
}
