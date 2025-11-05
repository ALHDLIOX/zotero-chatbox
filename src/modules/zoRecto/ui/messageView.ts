import { getString } from "../../../utils/locale";
import { renderMessage } from "../render";
import type { SessionMessage } from "../session";

export interface MessageDom {
  container: HTMLDivElement;
  content: HTMLDivElement;
  roleLabel: HTMLSpanElement;
  mathError: HTMLDivElement;
  actions?: HTMLDivElement;
  copyButton?: HTMLButtonElement;
  noteButton?: HTMLButtonElement;
  latestContent?: string;
}

export interface CitationTarget {
  attachmentID: number;
  page: number;
  quote?: string;
  locate?: string;
}

export class MessageView {
  private readonly doc: Document;
  private readonly onCopy: (messageId: string) => void;
  private readonly onNote?: (messageId: string) => void;
  private readonly messageNodes = new Map<string, MessageDom>();
  private readonly citationTargets = new WeakMap<HTMLElement, CitationTarget>();
  private readonly renderQueue = new Map<
    string,
    { entry: MessageDom; content: string; options?: { suppressMathError?: boolean } }
  >();
  private pendingRenderHandle?: number;

  constructor(
    doc: Document,
    onCopy: (messageId: string) => void,
    onNote?: (messageId: string) => void,
  ) {
    this.doc = doc;
    this.onCopy = onCopy;
    this.onNote = onNote;
  }

  keys(): IterableIterator<string> {
    return this.messageNodes.keys();
  }

  get(messageId: string): MessageDom | undefined {
    return this.messageNodes.get(messageId);
  }

  delete(messageId: string): void {
    this.messageNodes.delete(messageId);
  }

  clear(): void {
    this.messageNodes.clear();
    this.clearPendingRenders();
  }

  ensureMessageDom(message: SessionMessage): MessageDom {
    const existing = this.messageNodes.get(message.id);
    if (existing) return existing;

    const container = ztoolkit.UI.createElement(this.doc, "div", {
      classList: ["zorecto-message"],
      attributes: { "data-message-id": message.id },
    });

    const roleLabel = ztoolkit.UI.createElement(this.doc, "span", {
      classList: ["zorecto-message-role"],
      properties: { hidden: true },
    });

    const content = ztoolkit.UI.createElement(this.doc, "div", {
      classList: ["zorecto-message-content"],
    });

    const mathError = ztoolkit.UI.createElement(this.doc, "div", {
      classList: ["zorecto-message-math-error"],
      properties: { hidden: true },
    });

    // Only render actions/copy button for assistant messages
    let actions: HTMLDivElement | undefined;
    let copyButton: HTMLButtonElement | undefined;
    let noteButton: HTMLButtonElement | undefined;
    if (message.role === "assistant") {
      actions = ztoolkit.UI.createElement(this.doc, "div", {
        classList: ["zorecto-message-actions"],
        properties: { hidden: true },
      });

      copyButton = ztoolkit.UI.createElement(this.doc, "button", {
        classList: ["zorecto-copy-button"],
        properties: {
          type: "button",
          title: getString("zorecto-copy-button"),
        } as any,
        listeners: [
          {
            type: "click",
            listener: () => this.onCopy(message.id),
          },
        ],
      });

      // Add Ant Design copy icon (CopyOutlined)
      try {
        const copyIcon = this.doc.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg",
        ) as unknown as SVGSVGElement;
        copyIcon.setAttribute("viewBox", "0 0 1024 1024");
        copyIcon.setAttribute("width", "14");
        copyIcon.setAttribute("height", "14");
        copyIcon.setAttribute("aria-hidden", "true");
        copyIcon.setAttribute("fill", "currentColor");
        copyIcon.style.display = "block";
        const copyPath = this.doc.createElementNS("http://www.w3.org/2000/svg", "path");
        copyPath.setAttribute("d", "M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z");
        copyPath.setAttribute("fill", "currentColor");
        copyIcon.appendChild(copyPath);
        copyButton.appendChild(copyIcon);
      } catch (e) {
        copyButton.textContent = getString("zorecto-copy-button");
      }

      actions.appendChild(copyButton);

      // Note button: add to item notes
      noteButton = ztoolkit.UI.createElement(this.doc, "button", {
        classList: ["zorecto-note-button"],
        properties: {
          type: "button",
          title: getString("zorecto-note-button"),
        } as any,
        listeners: [
          {
            type: "click",
            listener: () => this.onNote && this.onNote(message.id),
          },
        ],
      });

      // Add official Ant Design FileTextOutlined icon (fallback to text on error)
      try {
        const noteIcon = this.doc.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg",
        ) as unknown as SVGSVGElement;
        noteIcon.setAttribute("viewBox", "64 64 896 896");
        noteIcon.setAttribute("width", "14");
        noteIcon.setAttribute("height", "14");
        noteIcon.setAttribute("aria-hidden", "true");
        noteIcon.setAttribute("fill", "currentColor");
        noteIcon.style.display = "block";
        const path = this.doc.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute(
          "d",
          "M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0042 42h216v494zM504 618H320c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8zM312 490v48c0 4.4 3.6 8 8 8h384c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H320c-4.4 0-8 3.6-8 8z",
        );
        path.setAttribute("fill", "currentColor");
        noteIcon.appendChild(path);
        noteButton.appendChild(noteIcon);
      } catch (e) {
        noteButton.textContent = getString("zorecto-note-button");
      }

      actions.appendChild(noteButton);
    }

    // Role label intentionally not shown in UI
    container.appendChild(content);
    container.appendChild(mathError);
    if (actions) container.appendChild(actions);

    const entry: MessageDom = {
      container,
      content,
      roleLabel,
      mathError,
      actions,
      copyButton,
      noteButton,
    };
    this.messageNodes.set(message.id, entry);
    return entry;
  }

  updateMessageDom(entry: MessageDom, message: SessionMessage): void {
    // Hide role label in bubbles
    entry.roleLabel.textContent = "";
    entry.latestContent = message.content;
    this.renderMessageContent(entry, message.content);
    entry.container.dataset.role = message.role;

    const isAssistant = message.role === "assistant";
    if (entry.actions) entry.actions.hidden = !isAssistant;
    if (entry.copyButton) {
      const hasContent = Boolean(message.content && message.content.trim());
      entry.copyButton.disabled = !isAssistant || !hasContent;
    }
    if (entry.noteButton) {
      const hasContent = Boolean(message.content && message.content.trim());
      entry.noteButton.disabled = !isAssistant || !hasContent;
    }

    if (isAssistant && message.content) {
      try {
        this.applyCitations(entry, message.content);
      } catch (e) {
        void e;
      }
    }
  }

  scheduleMessageRender(
    messageId: string,
    entry: MessageDom,
    content: string,
    options?: { suppressMathError?: boolean },
  ): void {
    this.renderQueue.set(messageId, { entry, content, options });
    if (this.pendingRenderHandle !== undefined) return;
    const win = this.doc.defaultView;
    if (win && typeof win.requestAnimationFrame === "function") {
      this.pendingRenderHandle = win.requestAnimationFrame(() => {
        this.pendingRenderHandle = undefined;
        this.flushRenderQueue();
      });
    } else {
      this.flushRenderQueue();
    }
  }

  flushRenderQueue(): void {
    const items = Array.from(this.renderQueue.values());
    this.renderQueue.clear();
    for (const item of items) {
      this.renderMessageContent(item.entry, item.content, item.options);
    }
  }

  clearPendingRenders(): void {
    if (this.pendingRenderHandle !== undefined) {
      const win = this.doc.defaultView;
      if (win && typeof win.cancelAnimationFrame === "function") {
        win.cancelAnimationFrame(this.pendingRenderHandle);
      }
      this.pendingRenderHandle = undefined;
    }
    this.renderQueue.clear();
  }

  getCitationTarget(refEl: HTMLElement): CitationTarget | undefined {
    return this.citationTargets.get(refEl);
  }

  private renderMessageContent(
    entry: MessageDom,
    content: string,
    options?: { suppressMathError?: boolean },
  ): void {
    entry.latestContent = content;
    if (!content) {
      entry.content.replaceChildren();
      this.applyMathErrorState(entry, false, options?.suppressMathError);
      return;
    }

    const result = renderMessage(content, this.doc);
    entry.content.replaceChildren(result.fragment);
    const hasErrorNode = Boolean(
      entry.content.querySelector(".math-error, .katex-error"),
    );
    this.applyMathErrorState(
      entry,
      result.hasMathError && hasErrorNode,
      options?.suppressMathError,
    );
  }

  private applyMathErrorState(
    entry: MessageDom,
    hasError: boolean,
    suppress?: boolean,
  ): void {
    const show = Boolean(hasError && !suppress);
    entry.mathError.hidden = !show;
    entry.mathError.textContent = show
      ? getString("zorecto-math-render-error")
      : "";
  }

  // Parse inline citation markers and render small numeric buttons in-place
  private applyCitations(entry: MessageDom, content: string): void {
    const existing = entry.content.querySelectorAll(".zorecto-citations");
    for (let i = 0; i < existing.length; i++) {
      const el = existing[i] as HTMLElement;
      el.remove();
    }

    let serial = 1; // restart numbering per assistant message
    const SHOW_TEXT = (this.doc.defaultView as any)?.NodeFilter?.SHOW_TEXT ?? 4;
    const walker = this.doc.createTreeWalker(entry.content, SHOW_TEXT);
    const toReplace: Array<{ node: Text; frag: DocumentFragment }> = [];

    while (true) {
      const node = walker.nextNode() as Text | null;
      if (!node) break;
      if (shouldSkipForCitations(node)) continue;
      const text = node.nodeValue || "";
      // Be lenient: allow spaces (incl. NBSP/ZWSP) and case-insensitive "cite", support ASCII and full-width parens.
      // Allow optional spaces between the closing parentheses as well.
      const re = /(?:\(\(|（（)[\s\u00A0\u200B\u200C\u200D]*cite[\s\u00A0\u200B\u200C\u200D]*[:：][\s\u00A0\u200B\u200C\u200D]*([\s\S]*?)[\s\u00A0\u200B\u200C\u200D]*(?:\)\s*\)|）\s*）)/gi;
      let last = 0;
      let matched = false;
      const frag = this.doc.createDocumentFragment();
      for (const m of text.matchAll(re)) {
        matched = true;
        const start = m.index ?? 0;
        const before = text.slice(last, start);
        if (before) frag.appendChild(this.doc.createTextNode(before));
        const payload = m[1] || "";
        const parsed = parseInlineCitationsArray(payload);
        if (!parsed || parsed.cites.length === 0) {
          frag.appendChild(
            this.doc.createTextNode(
              text.slice(start, start + (m[0]?.length || 0)),
            ),
          );
        } else {
          try {
            // Log all parsed citation objects (raw if available, otherwise the normalized cites)
            ztoolkit.log("[zorecto] 内联引用解析", {
              payload,
              count: parsed.cites.length,
              rawObjects: parsed.rawObjects ?? parsed.cites,
            });
          } catch (e) {
            void e;
          }
          const group = ztoolkit.UI.createElement(this.doc, "span", {
            classList: ["zorecto-citations"],
            attributes: { role: "group" },
          });
          for (const c of parsed.cites) {
            const ref = ztoolkit.UI.createElement(this.doc, "span", {
              classList: ["zorecto-cite-ref"],
              attributes: {
                role: "button",
                tabindex: "0",
                "aria-label": getString("zorecto-citation-aria", {
                  args: { page: Number(c.page) || 1 },
                } as any),
                title: c && (typeof c.locate === "string" && c.locate.trim())
                  ? `page ${Number(c.page) || 1} · ${String(c.locate).trim()}`
                  : `page ${Number(c.page) || 1}`,
              },
              properties: { textContent: String(serial++) },
            });
            this.citationTargets.set(ref, {
              attachmentID: Number(c.attachmentID),
              page: Number(c.page),
              quote:
                typeof c.quote === "string" ? (c.quote as string) : undefined,
              locate:
                typeof c.locate === "string" ? (c.locate as string) : undefined,
            });
            group.appendChild(ref);
          }
          frag.appendChild(group);
        }
        last = start + (m[0]?.length || 0);
      }
      if (!matched) continue;
      const tail = text.slice(last);
      if (tail) frag.appendChild(this.doc.createTextNode(tail));
      toReplace.push({ node, frag });
    }

    for (const { node, frag } of toReplace) {
      node.parentNode?.replaceChild(frag, node);
    }

    try {
      const codes = entry.content.querySelectorAll("pre > code");
      for (let i = 0; i < codes.length; i++) {
        const code = codes[i] as HTMLElement;
        const lang = code.getAttribute("data-language")?.toLowerCase();
        const text = (code.textContent || "").trim();
        if (lang === "zotero-citations" || looksLikeCitationsJson(text)) {
          const pre = code.parentElement as HTMLElement | null;
          if (pre) pre.classList.add("zorecto-hidden");
          else code.classList.add("zorecto-hidden");
        }
      }
    } catch (e) {
      void e;
    }
  }
}

const ROLE_LABELS: Record<SessionMessage["role"], string> = {
  user: "我",
  assistant: "AI",
  system: "系统",
};

function looksLikeCitationsJson(text: string): boolean {
  if (!text || text.length < 10) return false;
  const trimmed = text.trim();
  if (trimmed.indexOf("{") === -1 || trimmed.lastIndexOf("}") === -1) return false;
  const jsonSlice = trimmed.slice(
    trimmed.indexOf("{"),
    trimmed.lastIndexOf("}") + 1,
  );
  try {
    const data = JSON.parse(jsonSlice);
    if (!data || typeof data !== "object") return false;
    const arr = (data as any).paragraphs;
    return Array.isArray(arr);
  } catch {
    return false;
  }
}

interface ParsedCitations {
  cites: CitationTarget[];
  rawObjects?: Array<Record<string, unknown>>;
}

function parseInlineCitationsArray(
  text: string,
): ParsedCitations | undefined {
  if (!text) return undefined;
  const trimmed = text.trim();
  let jsonSlice = trimmed;
  const l = trimmed.indexOf("{") !== -1 ? trimmed.indexOf("{") : trimmed.indexOf("[");
  const r = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
  if (l !== -1 && r !== -1 && r > l) {
    jsonSlice = trimmed.slice(l, r + 1);
  }

  // Normalize common typographic variations to improve parse success
  const normalized = jsonSlice
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"') // fancy double quotes → "
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'") // fancy single quotes → '
    .replace(/\s+/g, (m) => (m.indexOf("\n") >= 0 ? "\n" : " "));

  // First, try strict JSON
  try {
    const data = JSON.parse(normalized);
    const arr = Array.isArray(data) ? data : [data];
    const cites: CitationTarget[] = [];
    for (const c of arr) {
      const a = Number((c as any)?.attachmentID ?? (c as any)?.attachmentId);
      const p = Number((c as any)?.page);
      if (Number.isFinite(a) && Number.isFinite(p)) {
        cites.push({
          attachmentID: a,
          page: p,
          quote:
            typeof (c as any)?.quote === "string" ? (c as any).quote : undefined,
          locate:
            typeof (c as any)?.locate === "string"
              ? ((c as any).locate as string)
              : undefined,
        });
      }
    }
    if (cites.length > 0) return { cites, rawObjects: arr as Array<Record<string, unknown>> };
  } catch {
    // fallthrough to lenient parsing
  }

  // Lenient parsing: extract object-like chunks and pull numbers by key.
  const candidates: CitationTarget[] = [];
  const rawObjects: Array<Record<string, unknown>> = [];
  const objectLike = normalized.match(/{[^{}]*}/g);
  const scanTargets = objectLike && objectLike.length > 0 ? objectLike : [normalized];
  for (const chunk of scanTargets) {
    const idMatch = chunk.match(/attachment\s*id|attachmentID|attachmentId/i)
      ? chunk.match(/(?:attachment\s*id|attachmentID|attachmentId)\s*[:=]\s*(\d+)/i)
      : null;
    const pageMatch = chunk.match(/page\s*[:=]\s*(\d+)/i);
    if (!idMatch || !pageMatch) continue;
    const attachmentID = Number(idMatch[1]);
    const page = Number(pageMatch[1]);
    if (!Number.isFinite(attachmentID) || !Number.isFinite(page)) continue;
    const quoteMatch = chunk.match(/quote\s*[:=]\s*(["'`\u201C\u201D\u2018\u2019])([\s\S]*?)\1/);
    const locateMatch = chunk.match(/locate\s*[:=]\s*(["'`\u201C\u201D\u2018\u2019])([\s\S]*?)\1/i);
    candidates.push({
      attachmentID,
      page,
      quote: quoteMatch ? quoteMatch[2] : undefined,
      locate: locateMatch ? locateMatch[2] : undefined,
    });
    rawObjects.push({
      attachmentID,
      page,
      quote: quoteMatch ? quoteMatch[2] : undefined,
      locate: locateMatch ? locateMatch[2] : undefined,
    });
  }

  return candidates.length > 0 ? { cites: candidates, rawObjects } : undefined;
}

function shouldSkipForCitations(node: Text): boolean {
  let el: Node | null = node.parentNode;
  while (el && (el as any).nodeType === 1) {
    const tag = ((el as HTMLElement).tagName || "").toLowerCase();
    if (tag === "code" || tag === "pre") return true;
    const cls = (el as HTMLElement).className || "";
    if (/\b(katex|math-|zorecto-citations)\b/.test(cls)) return true;
    el = el.parentNode;
  }
  return false;
}
