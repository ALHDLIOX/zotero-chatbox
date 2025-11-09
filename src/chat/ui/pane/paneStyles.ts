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
  const appendStyleLink = (styleKey: string, href: string): void => {
    const link = ztoolkit.UI.createElement(doc, "link", {
      properties: { rel: "stylesheet", href },
      attributes: { "data-zorecto-style": styleKey },
      enableElementRecord: true,
    }) as HTMLLinkElement;
    (container as any).appendChild(link);
  };

  // Inject global design tokens/styles shared across UI (derived from chat css path)
  try {
    const globalHref = chatHref.replace(/zorecto\.css$/, "global.css");
    if (globalHref && !scope.querySelector('link[data-zorecto-style="global"]')) {
      appendStyleLink("global", globalHref);
    }
  } catch {}

  if (!scope.querySelector('link[data-zorecto-style="chat"]')) {
    appendStyleLink("chat", chatHref);
  }

  if (!scope.querySelector('link[data-zorecto-style="katex"]')) {
    appendStyleLink("katex", katexHref);
  }
}

// Water.css removed: base control transitions are now scoped in zorecto.css
