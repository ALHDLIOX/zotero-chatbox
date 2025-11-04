export interface SanitizeOptions {
  treatAsInline?: boolean;
}

const ALLOWED_TAGS = new Set([
  "a",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "ol",
  "p",
  "pre",
  "span",
  "strong",
  "ul",
  // Tables
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
]);

const MATH_TAG_PATTERN = /^(math|m[a-z]*|semantics|annotation)$/;

const ALLOWED_ATTRS = new Set([
  "href",
  "title",
  "target",
  "rel",
  "class",
  "aria-hidden",
  "aria-label",
  "role",
  "style",
  "data-role",
  "data-language",
]);

const SAFE_PROTOCOL = /^(https?:|mailto:)/i;
const SAFE_STYLE = /^[a-z0-9\-:;.%()\s]+$/i;
// Allow essential KaTeX classes. Missing `frac-line` previously caused fraction bars to disappear.
const ALLOWED_CLASS =
  /^(?:zorecto-|math-|katex|katex-|vlist|vlist-|m[a-z-]+|frac|frac-|pstrut|rule|clap|llap|rlap|sizing|fontsize-|strut)/;

const NODE_COMMENT =
  typeof Node !== "undefined" ? Node.COMMENT_NODE : /* comment */ 8;
const NODE_ELEMENT =
  typeof Node !== "undefined" ? Node.ELEMENT_NODE : /* element */ 1;
const NODE_TEXT =
  typeof Node !== "undefined" ? Node.TEXT_NODE : /* text */ 3;
const NODE_FRAGMENT =
  typeof Node !== "undefined"
    ? Node.DOCUMENT_FRAGMENT_NODE
    : /* document fragment */ 11;

export function sanitizeHtml(
  doc: Document,
  html: string,
  options: SanitizeOptions = {},
): DocumentFragment {
  const template = doc.createElement("template");
  template.innerHTML = html;
  sanitizeNode(template.content, options);
  return template.content;
}

export function sanitizeFragment(
  fragment: DocumentFragment,
  options: SanitizeOptions = {},
): DocumentFragment {
  sanitizeNode(fragment, options);
  return fragment;
}

function sanitizeNode(node: Node, options: SanitizeOptions): void {
  const children = Array.from(node.childNodes).filter((child): child is Node => child !== null);
  for (const child of children) {
    if (!child) {
      continue;
    }
    if (child.nodeType === NODE_COMMENT) {
      node.removeChild(child);
      continue;
    }

    if (child.nodeType === NODE_ELEMENT) {
      const element = child as Element;
      const tagName = element.tagName.toLowerCase();

      if (!isAllowedTag(tagName, node, options)) {
        replaceWithTextNode(node, element);
        continue;
      }

      if (!MATH_TAG_PATTERN.test(tagName)) {
        sanitizeAttributes(element);
      }

      sanitizeNode(element, options);
      continue;
    }

    if (child.nodeType === NODE_TEXT) {
      continue;
    }

    node.removeChild(child);
  }
}

function replaceWithTextNode(parent: Node, element: Element): void {
  const text = element.textContent ?? "";
  const textNode = parent.ownerDocument?.createTextNode(text);
  if (textNode) {
    parent.replaceChild(textNode, element);
  } else {
    parent.removeChild(element);
  }
}

function isAllowedTag(
  tagName: string,
  parent: Node,
  options: SanitizeOptions,
): boolean {
  if (MATH_TAG_PATTERN.test(tagName)) {
    return true;
  }

  if (ALLOWED_TAGS.has(tagName)) {
    return true;
  }

  if (
    options.treatAsInline &&
    parent.nodeType === NODE_FRAGMENT &&
    tagName === "p"
  ) {
    return true;
  }

  return false;
}

function sanitizeAttributes(element: Element): void {
  const attributes = Array.from(element.attributes);
  for (const attr of attributes) {
    const name = attr.name.toLowerCase();
    const value = attr.value;

    if (name.startsWith("on")) {
      element.removeAttribute(attr.name);
      continue;
    }

    if (!ALLOWED_ATTRS.has(name)) {
      element.removeAttribute(attr.name);
      continue;
    }

    if (name === "href" && !SAFE_PROTOCOL.test(value.trim())) {
      element.removeAttribute(attr.name);
      continue;
    }

    if (name === "target") {
      element.setAttribute("target", "_blank");
      continue;
    }

    if (name === "rel") {
      element.setAttribute("rel", "noopener noreferrer");
      continue;
    }

    if (name === "class") {
      const filtered = value
        .split(/\s+/)
        .filter((cls) => ALLOWED_CLASS.test(cls));
      if (filtered.length > 0) {
        element.setAttribute("class", filtered.join(" "));
      } else {
        element.removeAttribute("class");
      }
      continue;
    }

    if (name === "style" && !SAFE_STYLE.test(value)) {
      element.removeAttribute("style");
    }
  }
}
