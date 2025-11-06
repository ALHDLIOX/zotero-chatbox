/** Message actions for assistant messages. */
import { getSession, type SessionState } from "../state/sessionStore";
import { copyText } from "../services/clipboard";
import { getActiveReader } from "../services/readerNavigation";
import { renderNoteHtml } from "../render/note";
import { getString } from "../../shared/locale";
import { config } from "../../../package.json";

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

  let parentItemID: number | undefined;
  const scope = parseScopeForItemID(currentScopeKey);
  if (scope) {
    if (scope.kind === "item") parentItemID = scope.id;
    else if (scope.kind === "reader" || scope.kind === "attachment") {
      try {
        const attachment = (await Zotero.Items.getAsync(scope.id)) as Zotero.Item;
        const parent = (attachment && (attachment as any).parentItem) as Zotero.Item | undefined;
        parentItemID = parent?.id;
      } catch {}
    }
  }
  if (!parentItemID) {
    try {
      const reader = getActiveReader(doc);
      if (reader) {
        const attachment = (await Zotero.Items.getAsync(reader.itemID)) as Zotero.Item;
        const parent = (attachment && (attachment as any).parentItem) as Zotero.Item | undefined;
        parentItemID = parent?.id;
      }
    } catch {}
  }
  if (!parentItemID) {
    try {
      const win = (doc.defaultView || undefined) as any;
      const pane = win?.ZoteroPane;
      const sel = typeof pane?.getSelectedItems === "function" ? (pane.getSelectedItems(false) as Zotero.Item[]) : [];
      const first = Array.isArray(sel) && sel.length > 0 ? sel[0] : undefined;
      if (first) {
        if (first.isAttachment?.()) {
          const parent = (first as any).parentItem as Zotero.Item | undefined;
          parentItemID = parent?.id;
        } else if (first.isRegularItem?.()) {
          parentItemID = first.id;
        }
      }
    } catch {}
  }

  if (!parentItemID) {
    const pw = new ztoolkit.ProgressWindow(config.addonName, { closeOnClick: true, closeTime: 2000 })
      .createLine({ text: getString("zorecto-note-failed"), type: "error" })
      .show();
    pw.startCloseTimer(1800);
    return;
  }

  const note = new Zotero.Item("note");
  (note as any).parentID = parentItemID;
  note.setNote(html as any);
  await note.saveTx();

  const pw = new ztoolkit.ProgressWindow(config.addonName, { closeOnClick: true, closeTime: 1500 })
    .createLine({ text: getString("zorecto-note-added"), type: "default" })
    .show();
  pw.startCloseTimer(1200);
}

function parseScopeForItemID(currentScopeKey?: string): { kind: "reader" | "attachment" | "item"; id: number } | undefined {
  const key = currentScopeKey || "";
  const parts = key.split(":");
  if (parts.length >= 2) {
    const kind = parts[0] as "reader" | "attachment" | "item";
    const id = Number(parts[1]);
    if ((kind === "reader" || kind === "attachment" || kind === "item") && Number.isFinite(id)) {
      return { kind, id };
    }
  }
  return undefined;
}
