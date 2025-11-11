/**
 * Clipboard helpers for copying plain text replies to the OS clipboard.
 *
 * Purpose: Provide a single, reliable clipboard write path using toolkit's ClipboardHelper.
 * Dependencies: zotero-plugin-toolkit (ClipboardHelper), global ztoolkit for logging.
 * Invariants: No fallbacks. Failures only log a concise error and return.
 */
import { ClipboardHelper } from "zotero-plugin-toolkit";
import { getAssistantMessageText } from "./conversation";

/**
 * Copy plain text to the clipboard using toolkit ClipboardHelper only.
 * @param text - Plain text content to copy
 */
export async function copyText(text: string): Promise<void> {
  const payload = text ?? "";
  if (!payload.trim()) return;
  copyViaToolkit(payload);
}

/**
 * Copy an assistant message by id, falling back to provided text when missing.
 * @param sessionId - Active session identifier.
 * @param messageId - Assistant message id.
 * @param fallback - Optional plain text when session content not found.
 */
export async function copyAssistantMessageById(
  sessionId: string | undefined,
  messageId: string,
  fallback?: string,
): Promise<void> {
  const content = sessionId ? getAssistantMessageText(sessionId, messageId) : undefined;
  const text = (content ?? fallback ?? "").trim();
  if (!text) return;
  await copyText(text);
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

