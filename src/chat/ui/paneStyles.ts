/** Injects chat and KaTeX stylesheets into document or shadow root. */
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
      ztoolkit.log("[zorecto] no container for css injection");
    } catch (e) {
      void e;
    }
    return;
  }

  const scope: Document | ShadowRoot = (mount as any) || doc;

  // Inject global design tokens/styles shared across UI (derived from chat css path)
  try {
    const globalHref = chatHref.replace(/zorecto\.css$/, "global.css");
    if (globalHref && !scope.querySelector('link[data-zorecto-style="global"]')) {
      const link = doc.createElement("link");
      link.rel = "stylesheet";
      link.href = globalHref;
      link.setAttribute("data-zorecto-style", "global");
      (container as any).appendChild(link);
    }
  } catch {}

  if (!scope.querySelector('link[data-zorecto-style="chat"]')) {
    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.href = chatHref;
    link.setAttribute("data-zorecto-style", "chat");
    (container as any).appendChild(link);
  }

  if (!scope.querySelector('link[data-zorecto-style="katex"]')) {
    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.href = katexHref;
    link.setAttribute("data-zorecto-style", "katex");
    (container as any).appendChild(link);
  }
}

// Water.css removed: base control transitions are now scoped in zorecto.css
