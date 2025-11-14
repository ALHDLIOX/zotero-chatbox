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
    const props = {
      tag: "link",
      properties: { rel: "stylesheet", href },
      attributes: { "data-zorecto-style": styleKey },
      enableElementRecord: true,
    } as const;
    const elem = container as unknown as Element | null;
    if (elem && typeof (elem as any).appendChild === "function" && (elem as any).tagName) {
      ztoolkit.UI.appendElement(props as any, elem);
    } else {
      const link = ztoolkit.UI.createElement(doc, "link", props as any) as HTMLLinkElement;
      (container as any).appendChild(link);
    }
  };

  // Inject global design tokens/styles shared across UI (derived from chat css path)
  try {
    const globalHref = chatHref.replace(/zorecto\.css$/, "global.css");
    if (globalHref && !scope.querySelector('link[data-zorecto-style="global"]')) {
      appendStyleLink("global", globalHref);
    }
  } catch {}

  // Inject component library (button primitives), before chat CSS for proper overrides
  try {
    const componentHref = chatHref.replace(/zorecto\.css$/, "component.css");
    if (componentHref && !scope.querySelector('link[data-zorecto-style="components"]')) {
      appendStyleLink("components", componentHref);
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
