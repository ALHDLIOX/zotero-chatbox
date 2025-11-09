/**
 * Clipboard helpers for copying plain text replies to the OS clipboard.
 *
 * Purpose: Provide a single, reliable clipboard write path using toolkit's ClipboardHelper.
 * Dependencies: zotero-plugin-toolkit (ClipboardHelper), global ztoolkit for logging.
 * Invariants: No fallbacks. Failures only log a concise error and return.
 */
import { ClipboardHelper } from "zotero-plugin-toolkit";

/**
 * Copy plain text to the clipboard using toolkit ClipboardHelper only.
 * @param text - Plain text content to copy
 */
export async function copyText(text: string): Promise<void> {
  const payload = text ?? "";
  if (!payload.trim()) return;
  copyViaToolkit(payload);
}

function copyViaToolkit(text: string): boolean {
  try {
    // Prefer direct class from toolkit to avoid relying on ztoolkit instance shape
    new ClipboardHelper().addText(text, "text/unicode").copy();
    return true;
  } catch (error) {
    try {
      ztoolkit.log("[zorecto] ClipboardHelper copy failed", error);
    } catch {}
    return false;
  }
}
