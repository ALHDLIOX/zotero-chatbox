import { getString } from "../../shared/locale";
import { config } from "../../../package.json";
import { getActiveReader } from "./readerNavigation";

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

export async function createNotes(
  doc: Document,
  html: string,
  currentScopeKey?: string,
): Promise<void> {
  if (!html || !html.trim()) return;

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

  // Detailed diagnostic log after note is created, including citation summary
  try {
    const tpl = doc.createElement("template");
    tpl.innerHTML = html;
    const root = tpl.content;
    const blocks = Array.from(root.querySelectorAll('[data-citation-items]')) as HTMLElement[];
    const citations: Array<{
      index: number;
      items: Array<{ uris: string[]; itemData?: any }>;
    }> = [];
    blocks.forEach((el, i) => {
      const raw = el.getAttribute("data-citation-items") || "";
      let parsed: Array<{ uris: string[]; itemData?: any }> = [];
      try { parsed = JSON.parse(raw); } catch {}
      citations.push({ index: i + 1, items: parsed || [] });
    });
    ztoolkit.log("[zorecto] note added", {
      parentItemID,
      noteID: (note as any)?.id,
      scope: currentScopeKey || "",
      htmlLength: html.length,
      citationBlockCount: citations.length,
      citationBlocks: citations.map((c) => ({
        index: c.index,
        uris: c.items.map((it) => Array.isArray(it?.uris) ? (it.uris[0] || "") : ""),
      })),
    } as any);
  } catch {}

  const pw = new ztoolkit.ProgressWindow(config.addonName, { closeOnClick: true, closeTime: 1500 })
    .createLine({ text: getString("zorecto-note-added"), type: "default" })
    .show();
  pw.startCloseTimer(1200);
}
