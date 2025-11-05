import { getSession, type SessionMessage } from "../session";
import { getActiveReader } from "./readerNav";
import { ensureSession } from "../session";
import { setSessionContext, type SessionState } from "../session";

export async function collectRelevantAttachments(
  props: _ZoteroTypes.ItemPaneManagerSection.SectionHookArgs,
  doc: Document,
): Promise<Zotero.Item[]> {
  const attachments: Zotero.Item[] = [];
  try {
    if (props.tabType === "reader") {
      const reader = getActiveReader(doc);
      if (reader) {
        const item = (await Zotero.Items.getAsync(reader.itemID)) as Zotero.Item;
        if (item?.isAttachment?.()) {
          if (isPdfAttachment(item)) attachments.push(item);
        } else if (item?.isRegularItem?.()) {
          attachments.push(...(await getPdfAttachments(item)));
        }
      } else {
        ztoolkit.log("[zorecto] 未找到当前 Reader 实例");
      }
      return attachments;
    }

    if (props.item?.isAttachment?.()) {
      if (isPdfAttachment(props.item)) attachments.push(props.item);
      return attachments;
    }

    if (props.item?.isRegularItem?.()) {
      attachments.push(...(await getPdfAttachments(props.item)));
    }
  } catch (error) {
    ztoolkit.log("[zorecto] 收集附件失败", error);
  }
  return attachments;
}

export async function getPdfAttachments(item: Zotero.Item): Promise<Zotero.Item[]> {
  const results: Zotero.Item[] = [];
  try {
    const bestAttachmentId = await item.getBestAttachment?.();
    const seen = new Set<number>();

    if (typeof bestAttachmentId === "number") {
      const attachment = (await Zotero.Items.getAsync(bestAttachmentId)) as Zotero.Item;
      if (attachment?.isAttachment?.() && isPdfAttachment(attachment)) {
        results.push(attachment);
        seen.add(attachment.id);
      }
    }

    const attachmentIds = await item.getAttachments?.();
    if (Array.isArray(attachmentIds)) {
      for (const attachmentId of attachmentIds) {
        if (seen.has(attachmentId)) continue;
        const attachment = (await Zotero.Items.getAsync(attachmentId)) as Zotero.Item;
        if (attachment?.isAttachment?.() && isPdfAttachment(attachment)) {
          results.push(attachment);
          seen.add(attachment.id);
        }
      }
    }
  } catch (error) {
    ztoolkit.log("[zorecto] 获取 PDF 附件失败", error);
  }
  return results;
}

export function isPdfAttachment(item: Zotero.Item): boolean {
  const mime =
    (item as any).attachmentMIMEType ??
    (item as any).attachmentMimeType ??
    item.getField?.("mimeType");
  if (typeof mime !== "string") return false;
  return mime.toLowerCase().includes("pdf");
}

export async function readAttachmentsContext(attachments: Zotero.Item[]): Promise<{
  documentText?: string;
  hasFulltext: boolean;
  hasPageMap: boolean;
  attachmentIDs: number[];
}> {
  const contextParts: string[] = [];
  let hasPageMap = false;
  const attachmentIds = attachments.map((a) => a.id).sort((a, b) => a - b);

  for (const attachment of attachments) {
    try {
      const result = (await Zotero.PDFWorker.getFullText(attachment.id)) as {
        text?: string;
        pageMap?: unknown;
      };

      const attachmentTitle =
        (attachment as any).getDisplayTitle?.() ??
        attachment.getField("title") ??
        `Attachment ${attachment.id}`;

      const text = result?.text?.trim();
      if (text) {
        contextParts.push(`# ${attachmentTitle}\n${text}`);
      } else {
        ztoolkit.log("[zorecto] 附件全文为空", {
          attachmentID: attachment.id,
          title: attachmentTitle,
        });
      }

      const pageMap = (result as any)?.pageMap;
      if (Array.isArray(pageMap) && pageMap.length > 0) {
        hasPageMap = true;
      }
    } catch (error) {
      ztoolkit.log("[zorecto] 获取附件全文失败", {
        attachmentID: attachment.id,
        error,
      });
    }
  }

  const documentText = contextParts.join("\n\n").trim();
  const hasFulltext = documentText.length > 0;
  return {
    documentText: hasFulltext ? documentText : undefined,
    hasFulltext,
    hasPageMap,
    attachmentIDs: attachmentIds,
  };
}

export function buildContextMessage(
  sessionId: string,
): SessionMessage | undefined {
  const session = getSession(sessionId);
  const documentText = session?.context.documentText?.trim();
  const attachmentIDs = (session?.context.attachmentIDs || []).slice();

  if (!documentText && attachmentIDs.length === 0) return undefined;

  // Build an "Allowed Attachments" list so the model only uses valid IDs in ((cite)) markers
  let allowedSection = "";
  try {
    const lines: string[] = [];
    const items: Array<{ attachmentID: number; title: string; parentKey: string; startPage?: number }> = [];

    for (const id of attachmentIDs) {
      try {
        const Items: any = (Zotero as any)?.Items;
        const attachment = Items?.get?.(id);
        if (!attachment) continue;
        const parent = attachment.isAttachment?.() ? (attachment as any).parentItem : attachment;
        if (!parent) continue;
        const title =
          (parent as any).getField?.("title") ||
          (parent as any).getDisplayTitle?.() ||
          `Item ${parent.id}`;
        const parentKey = (parent as any).key || (parent as any).getField?.("key") || String(parent.id || "");
        let startPage: number | undefined;
        try {
          const pages: string = (parent as any).getField?.("pages") || "";
          const m = String(pages).match(/\d+/);
          if (m) startPage = Number(m[0]);
        } catch (e) {
          void e;
        }
        items.push({ attachmentID: id, title: String(title), parentKey: String(parentKey), startPage });
      } catch (e) {
        void e;
      }
    }

    if (items.length > 0) {
      const json = JSON.stringify(items);
      lines.push(
        "# Allowed Attachments",
        "",
        "- Use ONLY these attachmentIDs in ((cite: {...})) markers.",
        "- If not listed here, do not cite the attachment.",
        "",
        "```json",
        json,
        "```",
        "",
      );
      allowedSection = lines.join("\n");
    }
  } catch (e) {
    void e;
  }

  const header = "# Document Context";
  const contextSection = documentText ? `${header}\n${documentText}` : "";
  const parts = [allowedSection, contextSection].filter(Boolean);
  if (parts.length === 0) return undefined;

  return {
    id: `${sessionId}-context-${Date.now()}`,
    role: "system",
    content: parts.join("\n\n"),
    timestamp: Date.now(),
  };
}

export async function loadContextForProps(
  sessionId: string,
  props: _ZoteroTypes.ItemPaneManagerSection.SectionHookArgs,
  doc: Document,
  previousAttachmentKey?: string,
): Promise<{ updated: SessionState; key?: string }> {
  const attachments = await collectRelevantAttachments(props, doc);
  const attachmentIds = attachments.map((i) => i.id).sort((a, b) => a - b);
  const key = attachmentIds.join(",");

  const session = ensureSession(sessionId);
  if (key && previousAttachmentKey === key && session.context.documentText) {
    return { updated: session, key };
  }

  if (attachments.length === 0) {
    const updated = setSessionContext(sessionId, {
      hasFulltext: false,
      hasPageMap: false,
      documentText: undefined,
      attachmentIDs: [],
    });
    return { updated, key: undefined };
  }

  const ctx = await readAttachmentsContext(attachments);
  const updated = setSessionContext(sessionId, ctx);
  return { updated, key };
}
