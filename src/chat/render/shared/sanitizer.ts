/**
 * Unified HTML sanitizer with presets for chat and note.
 */
function isSafeHref(href: string): boolean {
  if (!href) return false;
  try {
    const url = new URL(href, "https://example.com");
    const proto = (url.protocol || "").toLowerCase();
    return proto === "http:" || proto === "https:" || href.toLowerCase().startsWith("mailto:");
  } catch {
    return false;
  }
}
function normalizeAnchor(a: HTMLAnchorElement): void {
  try {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer nofollow");
  } catch {}
}

export interface SanitizeOptions { treatAsInline?: boolean }
export interface SanitizePreset {
  allowedTags: Set<string>;
  allowedAttrs: Set<string>;
  allowMathTags: boolean;
  allowClass?: (className: string) => boolean;
  allowStyle?: (value: string) => boolean;
  normalizeAnchor?: boolean;
}

const NODE_COMMENT = typeof Node !== "undefined" ? Node.COMMENT_NODE : 8;
const NODE_ELEMENT = typeof Node !== "undefined" ? Node.ELEMENT_NODE : 1;
const NODE_TEXT = typeof Node !== "undefined" ? Node.TEXT_NODE : 3;
const NODE_FRAGMENT = typeof Node !== "undefined" ? Node.DOCUMENT_FRAGMENT_NODE : 11;
const MATH_TAG_PATTERN = /^(math|m[a-z]*|semantics|annotation)$/;

export function sanitizeHtml(doc: Document, html: string, preset: SanitizePreset, options: SanitizeOptions = {}): DocumentFragment {
  const template = doc.createElement("template");
  template.innerHTML = html;
  sanitizeNode(template.content, preset, options);
  return template.content;
}
export function sanitizeFragment(fragment: DocumentFragment, preset: SanitizePreset, options: SanitizeOptions = {}): DocumentFragment {
  sanitizeNode(fragment, preset, options);
  return fragment;
}

function sanitizeNode(node: Node, preset: SanitizePreset, options: SanitizeOptions): void {
  const children = Array.from(node.childNodes).filter(Boolean) as Node[];
  for (const child of children) {
    if (child.nodeType === NODE_COMMENT) { node.removeChild(child); continue; }
    if (child.nodeType === NODE_ELEMENT) {
      const el = child as Element;
      const tag = (el.tagName || "").toLowerCase();
      if (!isAllowedTag(tag, node, options, preset)) { replaceWithText(node, el); continue; }
      if (!(preset.allowMathTags && MATH_TAG_PATTERN.test(tag))) { sanitizeAttributes(el, preset); }
      sanitizeNode(el, preset, options);
      continue;
    }
    if (child.nodeType !== NODE_TEXT) node.removeChild(child);
  }
}
function replaceWithText(parent: Node, el: Element): void {
  const text = el.textContent ?? "";
  const tn = parent.ownerDocument?.createTextNode(text);
  if (tn) parent.replaceChild(tn, el); else parent.removeChild(el);
}
function isAllowedTag(tag: string, parent: Node, options: SanitizeOptions, preset: SanitizePreset): boolean {
  if (preset.allowMathTags && MATH_TAG_PATTERN.test(tag)) return true;
  if (preset.allowedTags.has(tag)) return true;
  if (options.treatAsInline && parent.nodeType === NODE_FRAGMENT && tag === "p") return true;
  return false;
}
function sanitizeAttributes(el: Element, preset: SanitizePreset): void {
  const attrs = Array.from(el.attributes);
  for (const attr of attrs) {
    const name = attr.name.toLowerCase();
    const value = attr.value;
    if (name.startsWith("on")) { el.removeAttribute(attr.name); continue; }
    if (!preset.allowedAttrs.has(name)) { el.removeAttribute(attr.name); continue; }
    if (name === "href" && !isSafeHref(value.trim())) { el.removeAttribute(attr.name); continue; }
    if (name === "class") {
      if (!preset.allowClass) { el.removeAttribute("class"); }
      else {
        const filtered = value.split(/\s+/).filter((c) => !!c && preset.allowClass!(c));
        if (filtered.length > 0) el.setAttribute("class", filtered.join(" ")); else el.removeAttribute("class");
      }
      continue;
    }
    if (name === "style") { if (!preset.allowStyle || !preset.allowStyle(value)) el.removeAttribute("style"); continue; }
  }
  if (preset.normalizeAnchor && (el.tagName || "").toLowerCase() === "a") normalizeAnchor(el as HTMLAnchorElement);
}

// Unified preset for both chat/note.
// Rationale: block-level tags are required for chat; note 仅通过格式化器产生行内标签，
// 故统一允许集合不会放宽 note 的有效输入。KaTeX 类与 math 标签统一允许，
// note 端并不会生成相关 DOM，不会造成污染。
const ALLOWED_TAGS = new Set(["a","br","code","div","em","h1","h2","h3","li","ol","p","pre","span","strong","ul"]);
const ALLOWED_ATTRS = new Set(["href","title","target","rel","class","aria-hidden","aria-label","role","style","data-role","data-language"]);
const ALLOWED_CLASS = /^(?:zorecto-|math-|katex|katex-|vlist|vlist-|m[a-z-]+|frac|frac-|pstrut|rule|clap|llap|rlap|sizing|fontsize-|strut)/;
const SAFE_STYLE = /^[a-z0-9\-:;.%()\s]+$/i;
export const SANITIZER_PRESET: SanitizePreset = {
  allowedTags: ALLOWED_TAGS,
  allowedAttrs: ALLOWED_ATTRS,
  allowMathTags: true,
  allowClass: (c) => ALLOWED_CLASS.test(c),
  allowStyle: (v) => SAFE_STYLE.test(v),
  normalizeAnchor: true,
};
