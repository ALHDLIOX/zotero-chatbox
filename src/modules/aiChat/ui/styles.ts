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

export function ensureWaterCss(
  doc: Document,
  href: string,
  mount?: Document | ShadowRoot,
): void {
  const scope: Document | ShadowRoot = (mount as any) || doc;
  const has = scope.querySelector 
    ? scope.querySelector('link[data-ai-chat-style="ui"]')
    : undefined;
  if (has) return;

  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute("data-ai-chat-style", "ui");

  // Append to head if mount is Document; otherwise append to mount
  const head = (doc.head || doc.getElementsByTagName("head")[0]) as
    | HTMLHeadElement
    | undefined;
  const root = (doc.documentElement || (doc as any).documentElement) as
    | HTMLElement
    | null;
  if (!mount && head) {
    head.appendChild(link);
  } else if (mount && typeof (mount as any).appendChild === "function") {
    (mount as any).appendChild(link);
  } else if (head) {
    head.appendChild(link);
  } else if (root) {
    root.appendChild(link);
  }
}
