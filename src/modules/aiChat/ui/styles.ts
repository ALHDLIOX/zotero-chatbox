export function ensurePaneStyles(
  doc: Document,
  chatHref: string,
  katexHref: string,
  mount?: Document | ShadowRoot,
): void {
  const container: Document | ShadowRoot | HTMLElement | null =
    (mount as any) ||
    (doc.head ?? (doc.getElementsByTagName("head")[0] as HTMLHeadElement) ??
      (doc.documentElement as HTMLElement | null));
  if (!container || typeof (container as any).appendChild !== "function") {
    try {
      ztoolkit.log("[ai-chat] no container for css injection");
    } catch (e) {
      void e;
    }
    return;
  }

  const scope: Document | ShadowRoot = (mount as any) || doc;

  if (!scope.querySelector('link[data-ai-chat-style="chat"]')) {
    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.href = chatHref;
    link.setAttribute("data-ai-chat-style", "chat");
    (container as any).appendChild(link);
  }

  if (!scope.querySelector('link[data-ai-chat-style="katex"]')) {
    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.href = katexHref;
    link.setAttribute("data-ai-chat-style", "katex");
    (container as any).appendChild(link);
  }
}

// Water.css removed: base control transitions are now scoped in ai-chat.css
