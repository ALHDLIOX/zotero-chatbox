/** Message actions for assistant messages. */
import { getSession, type SessionState } from "../../../state/sessionStore";
import { copyText } from "../../../services/clipboard";
import { renderNoteHtml } from "../../../render/note/block";
import { createNotes } from "../../../services/createNotes";

export interface MessageDomLike { latestContent?: string }

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
  await copyText(doc, content);
}

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
