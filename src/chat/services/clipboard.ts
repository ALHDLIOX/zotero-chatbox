/** Copy plain text to clipboard with progressive fallbacks. */
export async function copyText(doc: Document, text: string): Promise<void> {
  const win = doc.defaultView as (Window & { navigator?: any }) | null;
  const clipboardApi = win && (win.navigator as any)?.clipboard;
  if (clipboardApi && typeof clipboardApi.writeText === "function") {
    await clipboardApi.writeText(text);
    return;
  }

  const copyWithZotero = (Zotero as any)?.Utilities?.Internal?.copyTextToClipboard;
  if (typeof copyWithZotero === "function") {
    await copyWithZotero(text);
    return;
  }

  fallbackCopyText(doc, text);
}

function fallbackCopyText(doc: Document, text: string): void {
  const textarea = doc.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "readonly");
  textarea.classList.add("zorecto-hidden-textarea");

  const body = doc.body ?? (doc.getElementsByTagName("body")[0] as HTMLBodyElement | undefined);
  if (!body) {
    try {
      ztoolkit.log("[zorecto] 未找到 body，复制降级不可用");
    } catch (e) {
      void e;
    }
    return;
  }
  body.appendChild(textarea);
  textarea.select();
  try {
    const ok = typeof doc.execCommand === "function" ? doc.execCommand("copy") : false;
    if (!ok) {
      ztoolkit.log("[zorecto] execCommand 无法复制文本");
    }
  } catch (error) {
    ztoolkit.log("[zorecto] 使用 execCommand 复制失败", error);
  } finally {
    textarea.remove();
  }
}
