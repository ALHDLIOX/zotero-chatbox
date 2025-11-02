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
  latestContent?: string;
}

export interface CitationTarget {
  attachmentID: number;
  page: number;
  quote?: string;
}

export class MessageView {
  private readonly doc: Document;
  private readonly onCopy: (messageId: string) => void;
  private readonly messageNodes = new Map<string, MessageDom>();
  private readonly citationTargets = new WeakMap<HTMLElement, CitationTarget>();
  private readonly renderQueue = new Map<
    string,
    { entry: MessageDom; content: string; options?: { suppressMathError?: boolean } }
  >();
  private pendingRenderHandle?: number;

  constructor(doc: Document, onCopy: (messageId: string) => void) {
    this.doc = doc;
    this.onCopy = onCopy;
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

    const container = this.doc.createElement("div");
    container.classList.add("ai-chat-message");
    container.dataset.messageId = message.id;

    const roleLabel = this.doc.createElement("span");
    roleLabel.classList.add("ai-chat-message-role");

    const content = this.doc.createElement("div");
    content.classList.add("ai-chat-message-content");

    const mathError = this.doc.createElement("div");
    mathError.classList.add("ai-chat-message-math-error");
    mathError.hidden = true;

    const actions = this.doc.createElement("div");
    actions.classList.add("ai-chat-message-actions");
    actions.hidden = true;

    const copyButton = this.doc.createElement("button");
    copyButton.type = "button";
    copyButton.classList.add("ai-chat-copy-button");
    copyButton.textContent = getString("ai-chat-copy-button");
    copyButton.addEventListener("click", () => {
      this.onCopy(message.id);
    });
    actions.appendChild(copyButton);

    container.appendChild(roleLabel);
    container.appendChild(content);
    container.appendChild(mathError);
    container.appendChild(actions);

    const entry: MessageDom = {
      container,
      content,
      roleLabel,
      mathError,
      actions,
      copyButton,
    };
    this.messageNodes.set(message.id, entry);
    return entry;
  }

  updateMessageDom(entry: MessageDom, message: SessionMessage): void {
    entry.roleLabel.textContent = ROLE_LABELS[message.role] ?? message.role;
    entry.latestContent = message.content;
    this.renderMessageContent(entry, message.content);
    entry.container.dataset.role = message.role;

    const isAssistant = message.role === "assistant";
    if (entry.actions) entry.actions.hidden = !isAssistant;
    if (entry.copyButton) {
      const hasContent = Boolean(message.content && message.content.trim());
      entry.copyButton.disabled = !isAssistant || !hasContent;
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
      ? getString("ai-chat-math-render-error")
      : "";
  }

  // Parse inline citation markers and render small numeric buttons in-place
  private applyCitations(entry: MessageDom, content: string): void {
    const existing = entry.content.querySelectorAll(".ai-chat-citations");
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
      const re = /(?:\(\(|（（)cite[:：]\s*([\s\S]*?)(?:\)\)|））)/g;
      let last = 0;
      let matched = false;
      const frag = this.doc.createDocumentFragment();
      for (const m of text.matchAll(re)) {
        matched = true;
        const start = m.index ?? 0;
        const before = text.slice(last, start);
        if (before) frag.appendChild(this.doc.createTextNode(before));
        const payload = m[1] || "";
        const cites = parseInlineCitationsArray(payload);
        if (!cites || cites.length === 0) {
          frag.appendChild(
            this.doc.createTextNode(
              text.slice(start, start + (m[0]?.length || 0)),
            ),
          );
        } else {
          const group = this.doc.createElement("span");
          group.classList.add("ai-chat-citations");
          group.setAttribute("role", "group");
          for (const c of cites) {
            const ref = this.doc.createElement("span");
            ref.classList.add("ai-chat-cite-ref");
            ref.setAttribute("role", "button");
            ref.setAttribute("tabindex", "0");
            ref.setAttribute(
              "aria-label",
              getString("ai-chat-citation-aria", {
                args: { page: Number(c.page) || 1 },
              } as any),
            );
            ref.textContent = String(serial++);
            this.citationTargets.set(ref, {
              attachmentID: Number(c.attachmentID),
              page: Number(c.page),
              quote:
                typeof c.quote === "string" ? (c.quote as string) : undefined,
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
          if (pre) pre.classList.add("ai-chat-hidden");
          else code.classList.add("ai-chat-hidden");
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

function parseInlineCitationsArray(
  text: string,
): CitationTarget[] | undefined {
  if (!text) return undefined;
  const trimmed = text.trim();
  let jsonSlice = trimmed;
  const l = trimmed.indexOf("{") !== -1 ? trimmed.indexOf("{") : trimmed.indexOf("[");
  const r = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
  if (l !== -1 && r !== -1 && r > l) {
    jsonSlice = trimmed.slice(l, r + 1);
  }
  try {
    const data = JSON.parse(jsonSlice);
    const arr = Array.isArray(data) ? data : [data];
    const cites: CitationTarget[] = [];
    for (const c of arr) {
      const a = Number((c as any)?.attachmentID);
      const p = Number((c as any)?.page);
      if (Number.isFinite(a) && Number.isFinite(p)) {
        cites.push({
          attachmentID: a,
          page: p,
          quote:
            typeof (c as any)?.quote === "string" ? (c as any).quote : undefined,
        });
      }
    }
    return cites.length > 0 ? cites : undefined;
  } catch {
    return undefined;
  }
}

function shouldSkipForCitations(node: Text): boolean {
  let el: Node | null = node.parentNode;
  while (el && (el as any).nodeType === 1) {
    const tag = ((el as HTMLElement).tagName || "").toLowerCase();
    if (tag === "code" || tag === "pre") return true;
    const cls = (el as HTMLElement).className || "";
    if (/\b(katex|math-|ai-chat-citations)\b/.test(cls)) return true;
    el = el.parentNode;
  }
  return false;
}
