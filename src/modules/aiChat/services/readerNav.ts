import type { SessionMessage } from "../session";

export interface CitationTarget {
  attachmentID: number;
  page: number;
  quote?: string;
}

export function getActiveReader(
  doc: Document,
): (_ZoteroTypes.Reader & { itemID: number }) | undefined {
  const win = (doc.defaultView || undefined) as
    | (Window & { Zotero_Tabs?: any })
    | undefined;
  const tabID = win?.Zotero_Tabs?.selectedID;
  if (!tabID) return undefined;
  const reader = Zotero.Reader.getByTabID(tabID) as unknown;
  if (reader && typeof (reader as { itemID?: unknown }).itemID === "number") {
    return reader as _ZoteroTypes.Reader & { itemID: number };
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
    ztoolkit.log("[ai-chat] 打开 Reader 失败", error);
  }

  try {
    await Zotero.Promise.delay(50);
  } catch (e) {
    void e;
  }

  const reader = getActiveReader(doc);
  if (!reader) return;

  // Ensure the viewer is ready before interacting
  await waitForPdfReady(reader, 5000).catch(() => undefined);

  try {
    const maybeSetPage = (reader as any)?.setPage || (reader as any)?.setPageNumber;
    if (typeof maybeSetPage === "function") {
      await maybeSetPage.call(reader, page);
    }
    const win = (reader as any)?._iframeWindow || (reader as any)?._internalWindow || undefined;
    const app = win?.PDFViewerApplication || win?.wrappedJSObject?.PDFViewerApplication;
    const pdfViewer = app?.pdfViewer || app?.viewer || app;
    if (pdfViewer && typeof pdfViewer === "object") {
      if (typeof pdfViewer.currentPageNumber === "number") {
        pdfViewer.currentPageNumber = page;
      } else if (typeof app?.page === "number") {
        (app as any).page = page;
      }
    }
  } catch (e) {
    ztoolkit.log("[ai-chat] 设置页码失败", e);
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
    ztoolkit.log("[ai-chat] 文本查找/高亮失败", e);
  }
}

