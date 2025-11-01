// Prefer the bundled KaTeX module; fall back to globals if needed
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import katexModule from "katex";

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

export interface MathRenderOptions {
  displayMode?: boolean;
}

export interface MathRenderResult {
  html: string;
  error?: string;
}

export function renderMath(
  latex: string,
  options: MathRenderOptions = {},
): MathRenderResult {
  const normalized = latex.trim();
  if (!normalized) {
    return {
      html: "",
      error: "empty",
    };
  }

  const katex = resolveKatex();
  if (!katex) {
    return {
      html: escapeHtml(latex),
      error: "katex-unavailable",
    };
  }

  try {
    const html = katex.renderToString(normalized, {
      displayMode: options.displayMode ?? false,
      throwOnError: false,
      strict: "ignore",
      output: "html",
      trust: false,
    });

    // Even if KaTeX returns elements with `katex-error`, keep the rendered HTML
    // so the user sees partial output instead of plain text.
    return { html };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "error");
    return {
      html: escapeHtml(latex),
      error: message || "render-error",
    };
  }
}

function resolveKatex(): KatexLike | undefined {
  try {
    if (katexModule && typeof (katexModule as any).renderToString === "function") {
      return katexModule as unknown as KatexLike;
    }
  } catch (e) {
    void e;
  }

  const globalKatex = (globalThis as { katex?: KatexLike }).katex;
  if (globalKatex) {
    return globalKatex;
  }

  try {
    if (
      typeof Zotero !== "undefined" &&
      typeof Zotero.getMainWindow === "function"
    ) {
      const mainWin = Zotero.getMainWindow();
      if (mainWin && typeof (mainWin as any).katex === "object") {
        return (mainWin as { katex?: KatexLike }).katex;
      }
    }
  } catch (error) {
    void error;
  }

  return undefined;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
