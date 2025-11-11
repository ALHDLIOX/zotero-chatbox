/** KaTeX-based LaTeX rendering to HTML. */
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import katexModule from "katex";
import { sanitizeHtml, SANITIZER_PRESET } from "../shared/sanitizer";

interface KatexLike {
  renderToString(expression: string, options?: KatexRenderOptions): string;
}
interface KatexRenderOptions {
  displayMode?: boolean;
  throwOnError?: boolean;
  strict?: boolean | string | ((errorCode: string, errorMsg: string) => void);
  output?: "html" | "mathml" | "htmlAndMathml";
  trust?: boolean | ((context: unknown) => boolean);
}
export interface MathRenderOptions { displayMode?: boolean }
export interface MathRenderResult { html: string; error?: string }

export function renderMath(latex: string, options: MathRenderOptions = {}): MathRenderResult {
  const normalized = latex.trim();
  if (!normalized) return { html: "", error: "empty" };
  const katex = resolveKatex();
  if (!katex) return { html: escapeHtml(latex), error: "katex-unavailable" };
  try {
    const html = katex.renderToString(normalized, { displayMode: options.displayMode ?? false, throwOnError: false, strict: "ignore", output: "html", trust: false });
    return { html };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? "error");
    return { html: escapeHtml(latex), error: message || "render-error" };
  }
}

/**
 * Render KaTeX output into a sanitized container element.
 *
 * - Uses <span.math-inline> for inline and <div.math-block> for display mode
 * - On error, marks container with .math-error and falls back to raw text
 */
export function renderMathNode(
  doc: Document,
  content: string,
  inline: boolean,
): { node: HTMLElement; hasError: boolean } {
  const container = inline ? doc.createElement("span") : doc.createElement("div");
  container.classList.add(inline ? "math-inline" : "math-block");
  const result = renderMath(content, { displayMode: !inline });
  if (result.error) {
    container.classList.add("math-error");
    container.textContent = content;
    return { node: container, hasError: true };
  }
  if (result.html) {
    const mathFragment = sanitizeHtml(doc, result.html, SANITIZER_PRESET);
    container.appendChild(mathFragment);
  }
  return { node: container, hasError: false };
}

function resolveKatex(): KatexLike | undefined {
  try { if (katexModule && typeof (katexModule as any).renderToString === "function") return katexModule as unknown as KatexLike; } catch {}
  const globalKatex = (globalThis as { katex?: KatexLike }).katex; if (globalKatex) return globalKatex;
  try {
    if (typeof Zotero !== "undefined" && typeof Zotero.getMainWindow === "function") {
      const mainWin = Zotero.getMainWindow();
      if (mainWin && typeof (mainWin as any).katex === "object") return (mainWin as { katex?: KatexLike }).katex;
    }
  } catch {}
  return undefined;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
