const KATEX_CDN_CSS =
  "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";

export function ensurePaneStyles(doc: Document, chatHref: string, katexHref: string): void {
  const head = doc.head ?? (doc.getElementsByTagName("head")[0] as HTMLHeadElement);
  const root = (doc.documentElement || (doc as any).documentElement) as HTMLElement | null;
  const container = (head || root) as HTMLElement | null;
  if (!container) {
    try {
      ztoolkit.log("[ai-chat] no head/root for css injection");
    } catch (e) {
      void e;
    }
    return;
  }

  if (!doc.querySelector('link[data-ai-chat-style="chat"]')) {
    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.href = chatHref;
    link.setAttribute("data-ai-chat-style", "chat");
    container.appendChild(link);
  }

  if (!doc.querySelector('link[data-ai-chat-style="katex"]')) {
    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.href = katexHref;
    link.setAttribute("data-ai-chat-style", "katex");
    link.addEventListener("error", () => {
      try {
        link.href = KATEX_CDN_CSS;
      } catch (e) {
        void e;
      }
    });
    container.appendChild(link);
  }
}

