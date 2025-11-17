/** Open Zotero Reader and navigate/highlight within PDFs. */
import type { SessionMessage } from "./session/sessionFacade";

export interface CitationTarget {
  attachmentID: number;
  page: number;
  quote?: string;
}

export function getActiveReader(
  doc: Document,
): (_ZoteroTypes.ReaderInstance & { itemID: number }) | undefined {
  // Prefer ztoolkit globals to detect selected reader tab
  try {
    const Tabs = (ztoolkit as any)?.getGlobal?.("Zotero_Tabs");
    const tabID = Tabs?.selectedID;
    if (tabID) {
      const reader = Zotero.Reader.getByTabID(tabID) as unknown;
      if (reader && typeof (reader as { itemID?: unknown }).itemID === "number") {
        return reader as _ZoteroTypes.ReaderInstance & { itemID: number };
      }
    }
  } catch (e) {
    void e;
  }

  // Fallback to window globals
  const win = (doc.defaultView || undefined) as
    | (Window & { Zotero_Tabs?: any })
    | undefined;
  const tabID = win?.Zotero_Tabs?.selectedID;
  if (!tabID) return undefined;
  const reader = Zotero.Reader.getByTabID(tabID) as unknown;
  if (reader && typeof (reader as { itemID?: unknown }).itemID === "number") {
    return reader as _ZoteroTypes.ReaderInstance & { itemID: number };
  }
  return undefined;
}

export async function getActiveReaderAsync(
  waitMs = 1000,
): Promise<(_ZoteroTypes.ReaderInstance & { itemID: number }) | undefined> {
  try {
    const reader = await (ztoolkit as any)?.Reader?.getReader?.(waitMs);
    if (reader && typeof (reader as { itemID?: unknown }).itemID === "number") {
      return reader as _ZoteroTypes.ReaderInstance & { itemID: number };
    }
  } catch (e) {
    void e;
  }
  return undefined;
}

export async function waitForPdfReady(
  reader: any,
  timeoutMs: number,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const win = reader?._iframeWindow || reader?._internalWindow || undefined;
      const app = win?.PDFViewerApplication || win?.wrappedJSObject?.PDFViewerApplication;
      const ok = Boolean(
        app &&
          app.pdfViewer &&
          ((app.pdfViewer.pagesCount && app.pdfViewer.pagesCount > 0) ||
            (app.pdfViewer._pages && app.pdfViewer._pages.length > 0)),
      );
      if (ok) return;
    } catch (e) {
      void e;
    }
    await Zotero.Promise.delay(100);
  }
}

export async function openReaderAndNavigate(
  doc: Document,
  attachmentID: number,
  page: number,
  quote?: string,
): Promise<void> {
  try {
    const openResult = (Zotero as any)?.Reader?.open?.(attachmentID);
    if (openResult && typeof openResult.then === "function") {
      await openResult;
    }
  } catch (error) {
    ztoolkit.log("[zorecto] 打开 Reader 失败", error);
  }

  try {
    await Zotero.Promise.delay(50);
  } catch (e) {
    void e;
  }

  // Prefer ztoolkit.Reader for the newly opened/selected reader; fallback to sync getter
  const reader = (await getActiveReaderAsync(1500)) || getActiveReader(doc);
  if (!reader) return;

  // Ensure the viewer is ready before interacting
  await waitForPdfReady(reader, 5000).catch(() => undefined);

  // Map journal page → PDF物理页码
  const targetPdfPage = await resolvePdfPageFromJournalPage(reader as any, attachmentID, page).catch(() => page);

  try {
    const maybeSetPage = (reader as any)?.setPage || (reader as any)?.setPageNumber;
    if (typeof maybeSetPage === "function") {
      await maybeSetPage.call(reader, targetPdfPage);
    }
    const win = (reader as any)?._iframeWindow || (reader as any)?._internalWindow || undefined;
    const app = win?.PDFViewerApplication || win?.wrappedJSObject?.PDFViewerApplication;
    const pdfViewer = app?.pdfViewer || app?.viewer || app;
    if (pdfViewer && typeof pdfViewer === "object") {
      if (typeof pdfViewer.currentPageNumber === "number") {
        pdfViewer.currentPageNumber = targetPdfPage;
      } else if (typeof app?.page === "number") {
        (app as any).page = targetPdfPage;
      }
    }
  } catch (e) {
    ztoolkit.log("[zorecto] 设置页码失败", e);
  }

  if (!quote || !quote.trim()) return;

  try {
    const readerAny = reader as any;
    const win = readerAny?._iframeWindow || readerAny?._internalWindow || undefined;
    const app = win?.PDFViewerApplication || win?.wrappedJSObject?.PDFViewerApplication;
    const findController = app?.findController;
    const eventBus = app?.eventBus;
    const query = String(quote).replace(/\s+/g, " ").slice(0, 256);

    if (findController && typeof findController.executeCommand === "function") {
      const opts = new (win as any).Object();
      (opts as any).query = query;
      (opts as any).phraseSearch = true;
      (opts as any).highlightAll = true;
      (opts as any).caseSensitive = false;
      (opts as any).findPrevious = false;
      (opts as any).entireWord = false;
      findController.executeCommand.call(findController, "find", opts as any);
    } else if (eventBus && typeof eventBus.dispatch === "function") {
      const ev = new (win as any).Object();
      (ev as any).type = "find";
      (ev as any).source = app;
      (ev as any).query = query;
      (ev as any).phraseSearch = true;
      (ev as any).highlightAll = true;
      (ev as any).caseSensitive = false;
      (ev as any).findPrevious = false;
      (ev as any).entireWord = false;
      eventBus.dispatch("find", ev as any);
    }
  } catch (e) {
    ztoolkit.log("[zorecto] 文本查找/高亮失败", e);
  }
}

/**
 * Try to convert a journal page number to the corresponding PDF physical page.
 * Strategy:
 * 1) Prefer PDF.js page labels (if embedded). If a label equals the target page
 *    or its numeric-only form matches, use that index.
 * 2) Fallback: use the parent item's pages field (e.g., "855-864") to get the
 *    first page as startPage, then map as (journalPage - startPage + 1).
 * 3) Clamp into [1, pagesCount]. If all fail, return the original number.
 */
async function resolvePdfPageFromJournalPage(
  reader: any,
  attachmentID: number,
  journalPage: number,
): Promise<number> {
  const win = reader?._iframeWindow || reader?._internalWindow || undefined;
  const app = win?.PDFViewerApplication || win?.wrappedJSObject?.PDFViewerApplication;
  const pdfViewer = app?.pdfViewer || app?.viewer || app;
  const pagesCount: number = Number(pdfViewer?.pagesCount || pdfViewer?._pages?.length || 0) || 0;

  // 1) Page labels lookup
  let labels: string[] | undefined;
  try {
    labels = (app as any)?._pageLabels || (pdfViewer as any)?._pageLabels || (await (app as any)?.pdfDocument?.getPageLabels?.());
  } catch {
    labels = undefined;
  }
  const journalStr = String(journalPage);
  const norm = (s: string) => s.replace(/[^0-9]/g, "").replace(/^0+/, "") || s;
  if (Array.isArray(labels) && labels.length > 0) {
    let idx = labels.findIndex((lbl) => String(lbl) === journalStr);
    if (idx === -1) {
      idx = labels.findIndex((lbl) => norm(String(lbl)) === journalStr);
    }
    if (idx >= 0) {
      const page1 = idx + 1;
      if (page1 >= 1 && (pagesCount ? page1 <= pagesCount : true)) return page1;
    }
  }

  // 2) Fallback by startPage from parent item
  const startPage = await getAttachmentStartPage(attachmentID);
  if (Number.isFinite(startPage as number)) {
    let mapped = (journalPage as number) - (startPage as number) + 1;
    if (!Number.isFinite(mapped)) mapped = journalPage;
    if (pagesCount > 0) {
      if (mapped < 1) mapped = 1;
      if (mapped > pagesCount) mapped = pagesCount;
    }
    return mapped;
  }

  // 3) As-is
  return journalPage;
}

async function getAttachmentStartPage(attachmentID: number): Promise<number | undefined> {
  try {
    const attachment = (await Zotero.Items.getAsync(attachmentID)) as any;
    if (!attachment) return undefined;
    const parent = attachment.isAttachment?.() ? attachment.parentItem : attachment;
    if (!parent) return undefined;
    const pages: string = parent.getField?.("pages") || "";
    // Extract the first arabic number in pages string, e.g., "855-864" → 855
    const m = String(pages).match(/\d+/);
    if (m) {
      const n = Number(m[0]);
      if (Number.isFinite(n)) return n;
    }
  } catch (e) {
    void e;
  }
  return undefined;
}
