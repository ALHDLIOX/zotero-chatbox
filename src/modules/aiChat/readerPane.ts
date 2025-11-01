import { config } from "../../../package.json";
import type { FluentMessageId } from "../../../typings/i10n";
import { getLocaleID, getString } from "../../utils/locale";
import {
  appendMessage,
  clearMessages,
  ensureSession,
  ensureSessionScope,
  getSession,
  removeMessage,
  setLastResult,
  setSessionContext,
  setSessionStatus,
  type SessionMessage,
  type SessionState,
  updateMessage,
} from "./session";
import { ProviderError, sendChat } from "./provider";
import { renderMessage } from "./render";

type SectionHookArgs = _ZoteroTypes.ItemPaneManagerSection.SectionHookArgs;
type SectionInitHookArgs =
  _ZoteroTypes.ItemPaneManagerSection.SectionInitHookArgs;

const PANE_ID = "ai-chat";
const PaneIcons = {
  header: `chrome://${config.addonRef}/content/icons/favicon.png`,
  sidenav: `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`,
} as const;

const CHAT_STYLESHEET_HREF = `chrome://${config.addonRef}/content/ai-chat.css`;
const KATEX_STYLESHEET_HREF = `chrome://${config.addonRef}/content/vendor/katex.min.css`;
const KATEX_CDN_CSS =
  "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";

const ROLE_LABELS: Record<SessionMessage["role"], string> = {
  user: "我",
  assistant: "AI",
  system: "系统",
};

interface MessageDom {
  container: HTMLDivElement;
  content: HTMLDivElement;
  roleLabel: HTMLSpanElement;
  mathError: HTMLDivElement;
  actions?: HTMLDivElement;
  copyButton?: HTMLButtonElement;
  latestContent?: string;
}

interface PendingRender {
  entry: MessageDom;
  content: string;
  options?: { suppressMathError?: boolean };
}

const paneControllers = new WeakMap<HTMLDivElement, AIChatPaneController>();

export async function registerAIChatReaderPane(): Promise<void> {
  const result = Zotero.ItemPaneManager.registerSection({
    paneID: PANE_ID,
    pluginID: config.addonID,
    header: {
      l10nID: getLocaleID("ai-chat-pane-header"),
      icon: PaneIcons.header,
    },
    sidenav: {
      l10nID: getLocaleID("ai-chat-pane-sidenav"),
      icon: PaneIcons.sidenav,
    },
    onInit: (props) => getController(props.body).onInit(props),
    onRender: (props) => getController(props.body).onRender(props),
    onAsyncRender: (props) => getController(props.body).onAsyncRender(props),
    onItemChange: (props) => getController(props.body).onItemChange(props),
    onDestroy: (props) => {
      const controller = paneControllers.get(props.body);
      controller?.onDestroy(props);
      paneControllers.delete(props.body);
    },
  });

  if (result === false) {
    ztoolkit.log("[ai-chat] 注册 AI 聊天面板失败：paneID 已存在");
  }
}

function getController(body: HTMLDivElement): AIChatPaneController {
  let controller = paneControllers.get(body);
  if (!controller) {
    controller = new AIChatPaneController(body);
    paneControllers.set(body, controller);
  }
  return controller;
}

class AIChatPaneController {
  private readonly body: HTMLDivElement;
  private readonly statusEl: HTMLDivElement;
  private readonly messagesEl: HTMLDivElement;
  private readonly placeholderEl: HTMLDivElement;
  private readonly errorEl: HTMLDivElement;
  private readonly inputEl: HTMLTextAreaElement;
  private readonly sendButton: HTMLButtonElement;
  private readonly clearButton: HTMLButtonElement;
  private readonly messageNodes = new Map<string, MessageDom>();
  private readonly renderQueue = new Map<string, PendingRender>();
  private readonly citationTargets = new WeakMap<HTMLElement, CitationTarget>();

  private sessionId?: string;
  private isContextLoading = false;
  private isSending = false;
  private currentAbortController?: AbortController;
  private currentScopeKey?: string;
  private contextAttachmentKey?: string;
  private contextLoadPromise?: Promise<void>;
  private pendingRenderHandle?: number;
  private loggedNoHeadOnce = false;

  constructor(body: HTMLDivElement) {
    this.body = body;
    const doc = this.getDocument();
    this.ensureStyles(doc);
    const container = doc.createElement("div");
    container.classList.add("ai-chat-pane");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.height = "100%";
    container.style.padding = "8px";
    container.style.boxSizing = "border-box";
    container.style.gap = "8px";

    this.statusEl = doc.createElement("div");
    this.statusEl.classList.add("ai-chat-status");
    this.statusEl.textContent = getString("ai-chat-status-loading");

    this.errorEl = doc.createElement("div");
    this.errorEl.classList.add("ai-chat-error");
    this.errorEl.hidden = true;
    this.errorEl.style.color = "var(--error-text, #c71515)";
    this.errorEl.style.whiteSpace = "pre-wrap";

    this.messagesEl = doc.createElement("div");
    this.messagesEl.classList.add("ai-chat-messages");
    this.messagesEl.style.flex = "1";
    this.messagesEl.style.overflowY = "auto";
    this.messagesEl.style.display = "flex";
    this.messagesEl.style.flexDirection = "column";
    this.messagesEl.style.gap = "8px";
    this.messagesEl.style.padding = "4px 0";

    this.placeholderEl = doc.createElement("div");
    this.placeholderEl.classList.add("ai-chat-empty-placeholder");
    this.placeholderEl.textContent = getString("ai-chat-empty-placeholder");
    this.placeholderEl.style.color = "var(--placeholder-text, #666)";
    this.placeholderEl.style.fontStyle = "italic";
    this.placeholderEl.style.textAlign = "center";
    this.placeholderEl.style.padding = "12px 8px";
    this.placeholderEl.style.border = "1px dashed rgba(0, 0, 0, 0.15)";
    this.placeholderEl.style.borderRadius = "6px";
    this.messagesEl.appendChild(this.placeholderEl);

    const inputWrapper = doc.createElement("div");
    inputWrapper.classList.add("ai-chat-input-wrapper");
    inputWrapper.style.display = "flex";
    inputWrapper.style.flexDirection = "column";
    inputWrapper.style.gap = "6px";

    const inputId = `ai-chat-input-${Math.random().toString(36).slice(2, 10)}`;
    const inputLabel = doc.createElement("label");
    inputLabel.classList.add("ai-chat-input-label");
    inputLabel.id = `${inputId}-label`;
    inputLabel.htmlFor = inputId;
    inputLabel.textContent = getString("ai-chat-input-label");

    this.inputEl = doc.createElement("textarea");
    this.inputEl.classList.add("ai-chat-input");
    this.inputEl.placeholder = getString("ai-chat-input-placeholder");
    this.inputEl.id = inputId;
    this.inputEl.setAttribute("aria-labelledby", inputLabel.id);
    this.inputEl.setAttribute("aria-label", getString("ai-chat-input-label"));
    this.inputEl.rows = 3;
    this.inputEl.style.resize = "vertical";
    this.inputEl.style.width = "100%";
    this.inputEl.style.boxSizing = "border-box";
    this.inputEl.style.padding = "8px";
    this.inputEl.style.borderRadius = "6px";

    this.sendButton = doc.createElement("button");
    this.sendButton.classList.add("ai-chat-send-button");
    this.sendButton.style.padding = "6px 14px";

    this.clearButton = doc.createElement("button");
    this.clearButton.classList.add("ai-chat-clear-button");
    this.clearButton.textContent = getString("ai-chat-clear-button");
    this.clearButton.style.padding = "6px 14px";
    this.clearButton.style.marginRight = "auto";

    const buttonRow = doc.createElement("div");
    buttonRow.classList.add("ai-chat-button-row");
    buttonRow.style.display = "flex";
    buttonRow.style.alignItems = "center";
    buttonRow.style.gap = "8px";
    buttonRow.style.justifyContent = "flex-end";

    buttonRow.appendChild(this.clearButton);
    buttonRow.appendChild(this.sendButton);

    inputWrapper.appendChild(inputLabel);
    inputWrapper.appendChild(this.inputEl);
    inputWrapper.appendChild(buttonRow);

    container.appendChild(this.statusEl);
    container.appendChild(this.errorEl);
    container.appendChild(this.messagesEl);
    container.appendChild(inputWrapper);

    body.replaceChildren(container);

    this.sendButton.addEventListener("click", (event: MouseEvent) => {
      event.preventDefault();
      if (this.isSending) {
        this.handleAbort();
      } else {
        void this.handleSubmit();
      }
    });

    // Delegated handlers for citation buttons
    this.messagesEl.addEventListener("click", (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest(".ai-chat-cite-ref") as HTMLElement | null;
      if (!el) return;
      event.preventDefault();
      void this.handleCitationActivate(el);
    });

    this.messagesEl.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key !== "Enter") return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const el = target.closest(".ai-chat-cite-ref") as HTMLElement | null;
      if (!el) return;
      event.preventDefault();
      void this.handleCitationActivate(el);
    });

    this.clearButton.addEventListener("click", (event: MouseEvent) => {
      event.preventDefault();
      this.handleClear();
    });

    this.inputEl.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Enter" && event.shiftKey && !this.isSending) {
        event.preventDefault();
        void this.handleSubmit();
      }
    });

    this.setSendingState(false);
  }

  private ensureStyles(doc: Document): void {
    const head =
      doc.head ?? (doc.getElementsByTagName("head")[0] as HTMLHeadElement);
    const root = (doc.documentElement || (doc as any).documentElement) as
      | HTMLElement
      | null;
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
      link.href = CHAT_STYLESHEET_HREF;
      link.setAttribute("data-ai-chat-style", "chat");
      container.appendChild(link);
    }

    if (!doc.querySelector('link[data-ai-chat-style="katex"]')) {
      const link = doc.createElement("link");
      link.rel = "stylesheet";
      link.href = KATEX_STYLESHEET_HREF;
      link.setAttribute("data-ai-chat-style", "katex");
      link.addEventListener("error", () => {
        // fallback to CDN stylesheet if local asset is missing
        try {
          link.href = KATEX_CDN_CSS;
        } catch (e) {
          void e;
        }
      });
      container.appendChild(link);
    }
  }

  // Note: KaTeX JS is bundled; we only ensure CSS is available (with CDN fallback).

  onInit(props: SectionInitHookArgs): void {
    this.assignSession(props);
  }

  onRender(props: SectionHookArgs): void {
    this.assignSession(props);
    this.refreshMessages();
    const session = this.sessionId ? ensureSession(this.sessionId) : undefined;
    if (session) {
      this.updateStatusDisplay(session);
    }
  }

  async onAsyncRender(props: SectionHookArgs): Promise<void> {
    this.assignSession(props);
    this.contextLoadPromise = this.loadContext(props);
    try {
      await this.contextLoadPromise;
    } catch (error) {
      ztoolkit.log("[ai-chat] 加载上下文失败", error);
    }
  }

  onItemChange(props: SectionHookArgs): void {
    this.assignSession(props);
    this.refreshMessages();
    if (this.sessionId) {
      this.contextLoadPromise = this.loadContext(props);
      void this.contextLoadPromise.catch((error) => {
        ztoolkit.log("[ai-chat] 刷新上下文失败", error);
      });
    }
  }

  onDestroy(_props: _ZoteroTypes.ItemPaneManagerSection.BasicHookArgs): void {
    if (this.currentAbortController) {
      try {
        this.currentAbortController.abort(
          typeof DOMException === "function"
            ? new DOMException("Pane destroyed", "AbortError")
            : undefined,
        );
      } catch (error) {
        ztoolkit.log("[ai-chat] 销毁面板时停止请求出错", error);
      }
    }
    this.currentAbortController = undefined;
    this.messageNodes.clear();
    this.sessionId = undefined;
    this.currentScopeKey = undefined;
    this.contextAttachmentKey = undefined;
    this.isContextLoading = false;
    this.isSending = false;
    this.updateActionButtonLabel();
    this.clearButton.disabled = true;
    this.clearPendingRenders();
  }

  private assignSession(props: SectionHookArgs): void {
    const sessionId = this.computeSessionId(props);
    if (!sessionId) {
      return;
    }

    const scopeKey = this.computeScopeKey(props) ?? sessionId;
    const isNewSessionId = this.sessionId !== sessionId;
    const isScopeChanged = this.currentScopeKey !== scopeKey;

    if (isNewSessionId) {
      this.sessionId = sessionId;
    }

    if (isNewSessionId || isScopeChanged) {
      this.currentScopeKey = scopeKey;
      this.contextAttachmentKey = undefined;
      this.clearPendingRenders();
      this.messageNodes.clear();
      this.messagesEl.replaceChildren(this.placeholderEl);
      this.clearError();
      this.isSending = false;
      this.currentAbortController = undefined;
      this.updateActionButtonLabel();
      this.clearButton.disabled = true;
    }

    const session = ensureSessionScope(sessionId, scopeKey);
    if (isNewSessionId || isScopeChanged) {
      this.updateClearButtonState(session);
      this.placeholderEl.hidden = session.messages.length > 0;
    }
  }

  private computeSessionId(props: SectionHookArgs): string | undefined {
    const win = this.getDocument().defaultView as
      | (Window & { Zotero_Tabs?: any; ZoteroPane?: any })
      | undefined;
    if (props.tabType === "reader") {
      const tabID = win?.Zotero_Tabs?.selectedID;
      if (tabID) {
        return `reader-${tabID}`;
      }
    }

    if (props.item?.isAttachment?.()) {
      const windowId = win?.ZoteroPane?.id ?? "attachment-pane";
      return `attachment-${props.item.id}-${windowId}`;
    }

    if (props.item?.isRegularItem?.()) {
      const windowId = win?.ZoteroPane?.id ?? "library-pane";
      return `item-${props.item.id}-${windowId}`;
    }

    return this.sessionId;
  }

  private computeScopeKey(props: SectionHookArgs): string | undefined {
    const win = this.getDocument().defaultView as
      | (Window & { ZoteroPane?: any })
      | undefined;
    const windowId = win?.ZoteroPane?.id ?? "main-window";

    if (props.tabType === "reader") {
      const reader = this.getActiveReader();
      if (reader) {
        return `reader:${reader.itemID}:${windowId}`;
      }
    }

    if (props.item?.isAttachment?.()) {
      return `attachment:${props.item.id}:${windowId}`;
    }

    if (props.item?.isRegularItem?.()) {
      return `item:${props.item.id}:${windowId}`;
    }

    return undefined;
  }

  private refreshMessages(): void {
    if (!this.sessionId) {
      return;
    }

    const session = ensureSession(this.sessionId);
    const existingIds = new Set(this.messageNodes.keys());

    for (const message of session.messages) {
      const entry = this.ensureMessageDom(message);
      this.updateMessageDom(entry, message);
      this.messagesEl.appendChild(entry.container);
      existingIds.delete(message.id);
    }

    for (const messageId of existingIds) {
      const entry = this.messageNodes.get(messageId);
      if (entry) {
        entry.container.remove();
      }
      this.messageNodes.delete(messageId);
    }

    this.placeholderEl.hidden = session.messages.length > 0;
    this.updateClearButtonState(session);
  }

  private ensureMessageDom(message: SessionMessage): MessageDom {
    const existing = this.messageNodes.get(message.id);
    if (existing) {
      return existing;
    }

    const doc = this.getDocument();
    const container = doc.createElement("div");
    container.classList.add("ai-chat-message");
    container.dataset.messageId = message.id;
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "4px";
    container.style.padding = "8px";
    container.style.borderRadius = "6px";
    container.style.backgroundColor =
      message.role === "user"
        ? "rgba(0, 122, 204, 0.12)"
        : "rgba(0, 0, 0, 0.05)";

    const roleLabel = doc.createElement("span");
    roleLabel.classList.add("ai-chat-message-role");
    roleLabel.style.fontSize = "12px";
    roleLabel.style.fontWeight = "bold";
    roleLabel.style.color = "rgba(0, 0, 0, 0.65)";

    const content = doc.createElement("div");
    content.classList.add("ai-chat-message-content");
    content.style.whiteSpace = "normal";
    content.style.lineHeight = "1.5";

    const mathError = doc.createElement("div");
    mathError.classList.add("ai-chat-message-math-error");
    mathError.hidden = true;
    // Ensure hidden state regardless of UA stylesheet precedence
    mathError.style.display = "none";

    const actions = doc.createElement("div");
    actions.classList.add("ai-chat-message-actions");
    actions.hidden = true;

    const copyButton = doc.createElement("button");
    copyButton.type = "button";
    copyButton.classList.add("ai-chat-copy-button");
    copyButton.textContent = getString("ai-chat-copy-button");
    copyButton.addEventListener("click", () => {
      this.copyAssistantMessage(message.id);
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

  private updateMessageDom(entry: MessageDom, message: SessionMessage): void {
    entry.roleLabel.textContent = ROLE_LABELS[message.role] ?? message.role;
    entry.latestContent = message.content;
    this.renderMessageContent(entry, message.content);
    entry.container.dataset.role = message.role;
    entry.container.style.backgroundColor =
      message.role === "user"
        ? "rgba(0, 122, 204, 0.12)"
        : message.role === "assistant"
          ? "rgba(92, 184, 92, 0.12)"
          : "rgba(0, 0, 0, 0.05)";

    const isAssistant = message.role === "assistant";
    if (entry.actions) {
      entry.actions.hidden = !isAssistant;
    }
    if (entry.copyButton) {
      const hasContent = Boolean(message.content && message.content.trim());
      entry.copyButton.disabled = !isAssistant || !hasContent;
    }

    // Try append citation controls (idempotent; no-op until metadata is complete)
    if (isAssistant && message.content) {
      try {
        this.applyCitations(entry, message.content);
      } catch (e) {
        void e;
      }
    }
  }

  private renderMessageContent(
    entry: MessageDom,
    content: string,
    options?: { suppressMathError?: boolean },
  ): void {
    entry.latestContent = content;
    const doc = this.getDocument();
    if (!content) {
      entry.content.replaceChildren();
      this.applyMathErrorState(entry, false, options?.suppressMathError);
      return;
    }

    const result = renderMessage(content, doc);
    entry.content.replaceChildren(result.fragment);
    // Secondary check: only show error if error containers remain
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
    // Inline style wins over author rules and UA defaults
    entry.mathError.style.display = show ? "flex" : "none";
    entry.mathError.textContent = show
      ? getString("ai-chat-math-render-error")
      : "";
  }

  // Parse inline citation markers and render small numeric buttons in-place
  private applyCitations(entry: MessageDom, content: string): void {
    // Remove existing to keep idempotent on re-render
    const existing = entry.content.querySelectorAll(
      ".ai-chat-citations",
    );
    for (let i = 0; i < existing.length; i++) {
      const el = existing[i] as HTMLElement;
      el.remove();
    }

    const doc = this.getDocument();
    let serial = 1; // restart numbering per assistant message

    const SHOW_TEXT = (doc.defaultView as any)?.NodeFilter?.SHOW_TEXT ?? 4;
    const walker = doc.createTreeWalker(entry.content, SHOW_TEXT);
    const toReplace: Array<{ node: Text; frag: DocumentFragment }> = [];

    while (true) {
      const node = walker.nextNode() as Text | null;
      if (!node) break;
      if (shouldSkipForCitations(node)) {
        continue;
      }
      const text = node.nodeValue || "";
      // Flexible regex: supports ASCII or full-width parentheses and colon
      const re = /(?:\(\(|（（)cite[:：]\s*([\s\S]*?)(?:\)\)|））)/g;
      let last = 0;
      let matched = false;
      const frag = doc.createDocumentFragment();
      for (const m of text.matchAll(re)) {
        matched = true;
        const start = m.index ?? 0;
        const before = text.slice(last, start);
        if (before) frag.appendChild(doc.createTextNode(before));
        const payload = m[1] || "";
        const cites = parseInlineCitationsArray(payload);
        if (!cites || cites.length === 0) {
          // keep original when parse failed
          frag.appendChild(doc.createTextNode(text.slice(start, start + (m[0]?.length || 0))));
        } else {
          const group = doc.createElement("span");
          group.classList.add("ai-chat-citations");
          group.setAttribute("role", "group");
          for (const c of cites) {
            const ref = doc.createElement("span");
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
              quote: typeof c.quote === "string" ? c.quote : undefined,
            });
            group.appendChild(ref);
          }
          frag.appendChild(group);
        }
        last = start + (m[0]?.length || 0);
      }
      if (!matched) {
        continue;
      }
      const tail = text.slice(last);
      if (tail) frag.appendChild(doc.createTextNode(tail));
      toReplace.push({ node, frag });
    }

    for (const { node, frag } of toReplace) {
      node.parentNode?.replaceChild(frag, node);
    }

    // Hide any code blocks that contain the citations JSON (regardless of info string)
    try {
      const codes = entry.content.querySelectorAll("pre > code");
      for (let i = 0; i < codes.length; i++) {
        const code = codes[i] as HTMLElement;
        const lang = code.getAttribute("data-language")?.toLowerCase();
        const text = (code.textContent || "").trim();
        if (lang === "zotero-citations" || looksLikeCitationsJson(text)) {
          const pre = code.parentElement as HTMLElement | null;
          if (pre) {
            pre.style.display = "none";
          } else {
            code.style.display = "none";
          }
        }
      }
    } catch (e) {
      void e;
    }
  }

  private async handleCitationActivate(refEl: HTMLElement): Promise<void> {
    const target = this.citationTargets.get(refEl);
    if (!target || !Number.isFinite(target.attachmentID) || !Number.isFinite(target.page)) {
      return;
    }
    try {
      await this.openReaderAndNavigate(target.attachmentID!, target.page!, target.quote);
    } catch (error) {
      ztoolkit.log("[ai-chat] 引用跳转失败", { error, target });
    }
  }

  private async openReaderAndNavigate(
    attachmentID: number,
    page: number,
    quote?: string,
  ): Promise<void> {
    try {
      const openResult = (Zotero as any)?.Reader?.open?.(attachmentID);
      if (openResult && typeof openResult.then === "function") {
        await openResult;
      }
    } catch (error) {
      ztoolkit.log("[ai-chat] 打开 Reader 失败", error);
    }

    try {
      await Zotero.Promise.delay(50);
    } catch (e) {
      void e;
    }

    const reader = this.getActiveReader();
    if (!reader) return;

    // Ensure the viewer is ready before interacting
    await this.waitForPdfReady(reader, 5000).catch(() => undefined);

    try {
      const maybeSetPage = (reader as any)?.setPage || (reader as any)?.setPageNumber;
      if (typeof maybeSetPage === "function") {
        await maybeSetPage.call(reader, page);
      }
      const win = (reader as any)?._iframeWindow || (reader as any)?._internalWindow || undefined;
      const app = win?.PDFViewerApplication || win?.wrappedJSObject?.PDFViewerApplication;
      const pdfViewer = app?.pdfViewer || app?.viewer || app;
      if (pdfViewer && typeof pdfViewer === "object") {
        if (typeof pdfViewer.currentPageNumber === "number") {
          pdfViewer.currentPageNumber = page;
        } else if (typeof app?.page === "number") {
          app.page = page;
        }
      }
    } catch (e) {
      ztoolkit.log("[ai-chat] 设置页码失败", e);
    }

    if (!quote || !quote.trim()) return;

    try {
      const win = (reader as any)?._iframeWindow || (reader as any)?._internalWindow || undefined;
      const app = win?.PDFViewerApplication || win?.wrappedJSObject?.PDFViewerApplication;
      const findController = app?.findController;
      const eventBus = app?.eventBus;
      const query = String(quote).replace(/\s+/g, " ").slice(0, 256);

      if (findController && typeof findController.executeCommand === "function") {
        const opts = new (win as any).Object();
        (opts as any).query = query;
        (opts as any).phraseSearch = true;
        (opts as any).highlightAll = true;
        (opts as any).caseSensitive = false;
        (opts as any).findPrevious = false;
        (opts as any).entireWord = false;
        findController.executeCommand.call(findController, "find", opts as any);
      } else if (eventBus && typeof eventBus.dispatch === "function") {
        const ev = new (win as any).Object();
        (ev as any).type = "find";
        (ev as any).source = app;
        (ev as any).query = query;
        (ev as any).phraseSearch = true;
        (ev as any).highlightAll = true;
        (ev as any).caseSensitive = false;
        (ev as any).findPrevious = false;
        (ev as any).entireWord = false;
        eventBus.dispatch("find", ev as any);
      }
    } catch (e) {
      ztoolkit.log("[ai-chat] 文本查找/高亮失败", e);
    }
  }

  private async waitForPdfReady(reader: any, timeoutMs: number): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const win = reader?._iframeWindow || reader?._internalWindow || undefined;
        const app = win?.PDFViewerApplication || win?.wrappedJSObject?.PDFViewerApplication;
        const ok = Boolean(
          app &&
            app.pdfViewer &&
            ((app.pdfViewer.pagesCount && app.pdfViewer.pagesCount > 0) ||
              (app.pdfViewer._pages && app.pdfViewer._pages.length > 0)),
        );
        if (ok) return;
      } catch (e) {
        void e;
      }
      await Zotero.Promise.delay(100);
    }
  }

  private async copyAssistantMessage(messageId: string): Promise<void> {
    try {
      const session = this.sessionId ? getSession(this.sessionId) : undefined;
      const message = session?.messages.find((item) => item.id === messageId);
      const entry = this.messageNodes.get(messageId);
      const content = message?.content ?? entry?.latestContent ?? "";
      if (!content.trim()) {
        ztoolkit.log("[ai-chat] 无可复制的文本", { messageId });
        return;
      }

      const win = this.getDocument().defaultView as
        | (Window & { navigator?: any })
        | null;
      const clipboardApi = win && (win.navigator as any)?.clipboard;
      if (clipboardApi && typeof clipboardApi.writeText === "function") {
        await clipboardApi.writeText(content);
        return;
      }

      const copyWithZotero =
        (Zotero as any)?.Utilities?.Internal?.copyTextToClipboard;
      if (typeof copyWithZotero === "function") {
        await copyWithZotero(content);
        return;
      }

      this.fallbackCopyText(content);
    } catch (error) {
      ztoolkit.log("[ai-chat] 复制消息失败", { messageId, error });
    }
  }

  private fallbackCopyText(text: string): void {
    const doc = this.getDocument();
    const textarea = doc.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    const body =
      doc.body ?? (doc.getElementsByTagName("body")[0] as HTMLBodyElement | undefined);
    if (!body) {
      try {
        ztoolkit.log("[ai-chat] 未找到 body，复制降级不可用");
      } catch (e) {
        void e;
      }
      return;
    }
    body.appendChild(textarea);
    textarea.select();
    try {
      const ok =
        typeof doc.execCommand === "function" ? doc.execCommand("copy") : false;
      if (!ok) {
        ztoolkit.log("[ai-chat] execCommand 无法复制文本");
      }
    } catch (error) {
      ztoolkit.log("[ai-chat] 使用 execCommand 复制失败", error);
    } finally {
      textarea.remove();
    }
  }

  private scheduleMessageRender(
    messageId: string,
    entry: MessageDom,
    content: string,
    options?: { suppressMathError?: boolean },
  ): void {
    this.renderQueue.set(messageId, { entry, content, options });
    if (this.pendingRenderHandle !== undefined) {
      return;
    }

    const win = this.getDocument().defaultView;
    if (win && typeof win.requestAnimationFrame === "function") {
      this.pendingRenderHandle = win.requestAnimationFrame(() => {
        this.pendingRenderHandle = undefined;
        this.flushRenderQueue();
      });
    } else {
      this.flushRenderQueue();
    }
  }

  private flushRenderQueue(): void {
    const items = Array.from(this.renderQueue.values());
    this.renderQueue.clear();
    for (const item of items) {
      this.renderMessageContent(item.entry, item.content, item.options);
    }
  }

  private clearPendingRenders(): void {
    if (this.pendingRenderHandle !== undefined) {
      const win = this.getDocument().defaultView;
      if (win && typeof win.cancelAnimationFrame === "function") {
        win.cancelAnimationFrame(this.pendingRenderHandle);
      }
      this.pendingRenderHandle = undefined;
    }
    this.renderQueue.clear();
  }

  private updateActionButtonLabel(): void {
    const labelKey = this.isSending
      ? "ai-chat-stop-button"
      : "ai-chat-send-button";
    this.sendButton.textContent = getString(labelKey);
    this.sendButton.dataset.mode = this.isSending ? "stop" : "send";
    this.sendButton.classList.toggle(
      "ai-chat-send-button--stop",
      this.isSending,
    );
  }

  private setSendingState(sending: boolean): void {
    this.isSending = sending;
    this.updateActionButtonLabel();
    if (this.sessionId) {
      this.updateClearButtonState(ensureSession(this.sessionId));
    } else {
      this.clearButton.disabled = true;
    }
  }

  private updateClearButtonState(session: SessionState): void {
    this.clearButton.disabled = this.isSending || session.messages.length === 0;
  }

  private handleAbort(): void {
    if (!this.isSending) {
      return;
    }

    const controller = this.currentAbortController;
    if (controller) {
      try {
        controller.abort(
          typeof DOMException === "function"
            ? new DOMException("Stopped by user", "AbortError")
            : undefined,
        );
      } catch (error) {
        ztoolkit.log("[ai-chat] 停止请求时出错", error);
      }
    } else {
      ztoolkit.log("[ai-chat] 当前环境不支持 AbortController，无法停止请求");
    }

    if (this.sessionId) {
      const state = setSessionStatus(this.sessionId, "stopped");
      this.updateStatusDisplay(state);
      ztoolkit.log("[ai-chat] 已请求停止当前流", {
        sessionId: this.sessionId,
        hasController: Boolean(controller),
      });
    }
  }

  private handleClear(): void {
    if (!this.sessionId) {
      return;
    }

    const state = clearMessages(this.sessionId);
    this.refreshMessages();
    this.updateStatusDisplay(state);
    this.clearError();
    ztoolkit.log("[ai-chat] 已清除会话消息", { sessionId: this.sessionId });
  }

  private createAbortController(): AbortController | undefined {
    if (typeof AbortController === "function") {
      return new AbortController();
    }

    const win = this.getDocument().defaultView as {
      AbortController?: new () => AbortController;
    };
    const windowCtor = win?.AbortController;
    if (typeof windowCtor === "function") {
      return new windowCtor();
    }

    const globalCtor = (globalThis as any)?.AbortController;
    if (typeof globalCtor === "function") {
      return new globalCtor();
    }

    return undefined;
  }

  private async handleSubmit(): Promise<void> {
    if (!this.sessionId) {
      this.showError(getString("ai-chat-error-server"));
      ztoolkit.log("[ai-chat] 会话未初始化，无法发送消息");
      return;
    }

    if (this.isSending) {
      return;
    }

    const text = this.inputEl.value.trim();
    if (!text) {
      return;
    }

    const userMessage = createSessionMessage("user", text);
    this.inputEl.value = "";
    this.clearError();
    this.setSendingState(true);

    appendMessage(this.sessionId, userMessage);
    this.refreshMessages();

    let state = setSessionStatus(this.sessionId, "sending");
    this.updateStatusDisplay(state);

    const contextMessage = this.buildContextMessage();
    const providerMessages = [
      ...(contextMessage ? [contextMessage] : []),
      ...ensureSession(this.sessionId).messages,
    ];

    const assistantMessage = createSessionMessage("assistant", "");
    appendMessage(this.sessionId, assistantMessage);
    this.refreshMessages();

    let aggregatedText = "";
    let streamingStarted = false;
    const abortController = this.createAbortController();
    this.currentAbortController = abortController;

    try {
      const response = await sendChat({
        messages: providerMessages,
        signal: abortController?.signal,
        onToken: (token) => {
          aggregatedText += token;
          updateMessage(this.sessionId!, assistantMessage.id, (message) => ({
            ...message,
            content: aggregatedText,
            timestamp: message.timestamp,
          }));

          const entry = this.messageNodes.get(assistantMessage.id);
          if (entry) {
            this.scheduleMessageRender(assistantMessage.id, entry, aggregatedText, {
              suppressMathError: true,
            });
          } else {
            this.refreshMessages();
          }

          if (!streamingStarted) {
            streamingStarted = true;
            const streamingState = setSessionStatus(
              this.sessionId!,
              "streaming",
            );
            this.updateStatusDisplay(streamingState);
          }
        },
      });

      if (!streamingStarted) {
        state = setSessionStatus(this.sessionId, "streaming");
        this.updateStatusDisplay(state);
      }

      updateMessage(this.sessionId, assistantMessage.id, (message) => ({
        ...message,
        content: response.completion,
        timestamp: Date.now(),
      }));
      this.refreshMessages();
      setLastResult(this.sessionId, {
        text: response.completion,
        usage: response.usage,
        raw: response.raw,
      });
      state = setSessionStatus(this.sessionId, "idle");
    } catch (error) {
      state = this.handleSendError(error, assistantMessage.id, aggregatedText);
    } finally {
      this.currentAbortController = undefined;
      this.updateStatusDisplay(state);
      this.setSendingState(false);
    }
  }

  private handleSendError(
    error: unknown,
    assistantMessageId: string,
    aggregatedText: string,
  ): SessionState {
    const sessionId = this.sessionId!;
    setLastResult(sessionId, undefined);

    if (error instanceof ProviderError) {
      ztoolkit.log("[ai-chat] ProviderError", {
        code: error.code,
        status: error.status,
        message: error.message,
        cause: error.cause,
        sessionId,
      });

      if (error.code === "ABORTED") {
        if (!aggregatedText.trim()) {
          removeMessage(sessionId, assistantMessageId);
          this.refreshMessages();
        }
        this.clearError();
        return setSessionStatus(sessionId, "stopped");
      }

      const messageKey = (error.messageKey ??
        "ai-chat-error-server") as FluentMessageId;
      this.showError(getString(messageKey));
      removeMessage(sessionId, assistantMessageId);
      this.refreshMessages();
      return setSessionStatus(sessionId, "idle");
    }

    ztoolkit.log("[ai-chat] 未知发送错误", {
      error,
      sessionId,
      assistantMessageId,
    });
    this.showError(getString("ai-chat-error-server"));
    removeMessage(sessionId, assistantMessageId);
    this.refreshMessages();
    return setSessionStatus(sessionId, "idle");
  }

  private buildContextMessage(): SessionMessage | undefined {
    if (!this.sessionId) {
      return undefined;
    }
    const session = getSession(this.sessionId);
    const documentText = session?.context.documentText?.trim();
    if (!documentText) {
      return undefined;
    }

    const header = "Document context:";
    return {
      id: `${this.sessionId}-context-${Date.now()}`,
      role: "system",
      content: `${header}\n${documentText}`,
      timestamp: Date.now(),
    };
  }

  private async loadContext(props: SectionHookArgs): Promise<void> {
    if (!this.sessionId) {
      return;
    }

    this.isContextLoading = true;
    if (!this.isSending) {
      this.statusEl.textContent = getString("ai-chat-status-loading");
    }

    try {
      const attachments = await this.collectRelevantAttachments(props);
      const attachmentIds = attachments
        .map((item) => item.id)
        .sort((a, b) => a - b);
      const key = attachmentIds.join(",");

      const session = ensureSession(this.sessionId);
      if (
        key &&
        this.contextAttachmentKey === key &&
        session.context.documentText
      ) {
        this.isContextLoading = false;
        this.updateStatusDisplay(session);
        return;
      }

      this.contextAttachmentKey = key || undefined;

      if (attachments.length === 0) {
        const updated = setSessionContext(this.sessionId, {
          hasFulltext: false,
          hasPageMap: false,
          documentText: undefined,
          attachmentIDs: [],
        });
        this.updateStatusDisplay(updated);
        this.isContextLoading = false;
        return;
      }

      const contextParts: string[] = [];
      let hasPageMap = false;

      for (const attachment of attachments) {
        try {
          const result = (await Zotero.PDFWorker.getFullText(
            attachment.id,
          )) as { text?: string; pageMap?: unknown };

          const attachmentTitle =
            (attachment as any).getDisplayTitle?.() ??
            attachment.getField("title") ??
            `Attachment ${attachment.id}`;

          const text = result?.text?.trim();
          if (text) {
            contextParts.push(`# ${attachmentTitle}\n${text}`);
          } else {
            ztoolkit.log("[ai-chat] 附件全文为空", {
              attachmentID: attachment.id,
              title: attachmentTitle,
            });
          }

          const pageMap = (result as any)?.pageMap;
          if (Array.isArray(pageMap) && pageMap.length > 0) {
            hasPageMap = true;
          }
        } catch (error) {
          ztoolkit.log("[ai-chat] 获取附件全文失败", {
            attachmentID: attachment.id,
            error,
          });
        }
      }

      const documentText = contextParts.join("\n\n").trim();
      const hasFulltext = documentText.length > 0;

      const updated = setSessionContext(this.sessionId, {
        hasFulltext,
        hasPageMap,
        documentText: hasFulltext ? documentText : undefined,
        attachmentIDs: attachmentIds,
      });

      ztoolkit.log("[ai-chat] 上下文加载完成", {
        sessionId: this.sessionId,
        hasFulltext: updated.context.hasFulltext,
        hasPageMap: updated.context.hasPageMap,
        attachments: attachmentIds,
      });

      this.updateStatusDisplay(updated);
    } finally {
      this.isContextLoading = false;
      if (this.sessionId) {
        this.updateStatusDisplay(ensureSession(this.sessionId));
      }
    }
  }

  private async collectRelevantAttachments(
    props: SectionHookArgs,
  ): Promise<Zotero.Item[]> {
    const attachments: Zotero.Item[] = [];
    try {
      if (props.tabType === "reader") {
        const reader = this.getActiveReader();
        if (reader) {
          const item = (await Zotero.Items.getAsync(
            reader.itemID,
          )) as Zotero.Item;
          if (item?.isAttachment?.()) {
            if (this.isPdfAttachment(item)) {
              attachments.push(item);
            }
          } else if (item?.isRegularItem?.()) {
            attachments.push(...(await this.getPdfAttachments(item)));
          }
        } else {
          ztoolkit.log("[ai-chat] 未找到当前 Reader 实例");
        }
        return attachments;
      }

      if (props.item?.isAttachment?.()) {
        if (this.isPdfAttachment(props.item)) {
          attachments.push(props.item);
        }
        return attachments;
      }

      if (props.item?.isRegularItem?.()) {
        attachments.push(...(await this.getPdfAttachments(props.item)));
      }
    } catch (error) {
      ztoolkit.log("[ai-chat] 收集附件失败", error);
    }
    return attachments;
  }

  private async getPdfAttachments(item: Zotero.Item): Promise<Zotero.Item[]> {
    const results: Zotero.Item[] = [];
    try {
      const bestAttachmentId = await item.getBestAttachment?.();
      const seen = new Set<number>();

      if (typeof bestAttachmentId === "number") {
        const attachment = (await Zotero.Items.getAsync(
          bestAttachmentId,
        )) as Zotero.Item;
        if (attachment?.isAttachment?.() && this.isPdfAttachment(attachment)) {
          results.push(attachment);
          seen.add(attachment.id);
        }
      }

      const attachmentIds = await item.getAttachments?.();
      if (Array.isArray(attachmentIds)) {
        for (const attachmentId of attachmentIds) {
          if (seen.has(attachmentId)) {
            continue;
          }
          const attachment = (await Zotero.Items.getAsync(
            attachmentId,
          )) as Zotero.Item;
          if (
            attachment?.isAttachment?.() &&
            this.isPdfAttachment(attachment)
          ) {
            results.push(attachment);
            seen.add(attachment.id);
          }
        }
      }
    } catch (error) {
      ztoolkit.log("[ai-chat] 获取 PDF 附件失败", error);
    }
    return results;
  }

  private isPdfAttachment(item: Zotero.Item): boolean {
    const mime =
      (item as any).attachmentMIMEType ??
      (item as any).attachmentMimeType ??
      item.getField?.("mimeType");
    if (typeof mime !== "string") {
      return false;
    }
    return mime.toLowerCase().includes("pdf");
  }

  private getActiveReader():
    | (_ZoteroTypes.Reader & { itemID: number })
    | undefined {
    const win = this.getDocument().defaultView as
      | (Window & { Zotero_Tabs?: any })
      | undefined;
    const tabID = win?.Zotero_Tabs?.selectedID;
    if (!tabID) {
      return undefined;
    }
    const reader = Zotero.Reader.getByTabID(tabID) as unknown;
    if (reader && typeof (reader as { itemID?: unknown }).itemID === "number") {
      return reader as _ZoteroTypes.Reader & { itemID: number };
    }
    return undefined;
  }

  private updateStatusDisplay(session: SessionState): void {
    if (session.status === "sending") {
      this.statusEl.textContent = getString("ai-chat-status-sending");
      return;
    }
    if (session.status === "streaming") {
      this.statusEl.textContent = getString("ai-chat-status-streaming");
      return;
    }

    if (session.status === "stopped") {
      this.statusEl.textContent = getString("ai-chat-status-stopped");
      return;
    }

    if (this.isContextLoading) {
      this.statusEl.textContent = getString("ai-chat-status-loading");
      return;
    }

    if (session.context.hasFulltext) {
      this.statusEl.textContent = getString("ai-chat-status-loaded");
    } else {
      this.statusEl.textContent = getString("ai-chat-status-missing");
    }
  }

  private getDocument(): Document {
    const doc = this.body.ownerDocument;
    if (!doc) {
      throw new Error("AI chat pane 缺少有效的 document");
    }
    return doc;
  }

  private showError(message: string): void {
    this.errorEl.hidden = false;
    this.errorEl.textContent = message;
  }

  private clearError(): void {
    this.errorEl.hidden = true;
    this.errorEl.textContent = "";
  }
}

function createSessionMessage(
  role: SessionMessage["role"],
  content: string,
): SessionMessage {
  return {
    id: createMessageId(),
    role,
    content,
    timestamp: Date.now(),
  };
}

function createMessageId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

interface CitationTarget {
  attachmentID: number;
  page: number;
  quote?: string;
}

interface CitationsMetadata {
  paragraphs: Array<{
    citations?: Array<CitationTarget>;
  }>;
}

function extractCitationsMetadata(content: string): CitationsMetadata | undefined {
  if (typeof content !== "string") return undefined;
  const fence = /```\s*(?:zotero-citations)\s*\n([\s\S]*?)```/i;
  const match = fence.exec(content);
  if (!match) return undefined;
  const jsonText = match[1]?.trim();
  if (!jsonText) return undefined;
  try {
    const data = JSON.parse(jsonText);
    if (!data || typeof data !== "object") return undefined;
    const arr = (data as any).paragraphs;
    if (!Array.isArray(arr)) return undefined;
    return {
      paragraphs: arr.map((p: any) => ({
        citations: Array.isArray(p?.citations) ? p.citations : [],
      })),
    };
  } catch (e) {
    return undefined;
  }
}

function looksLikeCitationsJson(text: string): boolean {
  if (!text || text.length < 10) return false;
  const trimmed = text.trim();
  if (trimmed.indexOf('{') === -1 || trimmed.lastIndexOf('}') === -1) return false;
  const jsonSlice = trimmed.slice(trimmed.indexOf('{'), trimmed.lastIndexOf('}') + 1);
  try {
    const data = JSON.parse(jsonSlice);
    if (!data || typeof data !== "object") return false;
    const arr = (data as any).paragraphs;
    return Array.isArray(arr);
  } catch {
    return false;
  }
}

function parseCitationsMetadataFromText(text: string): CitationsMetadata | undefined {
  if (!text) return undefined;
  const trimmed = text.trim();
  const l = trimmed.indexOf('{');
  const r = trimmed.lastIndexOf('}');
  if (l === -1 || r === -1 || r <= l) return undefined;
  const jsonSlice = trimmed.slice(l, r + 1);
  try {
    const data = JSON.parse(jsonSlice);
    if (!data || typeof data !== 'object') return undefined;
    const arr = (data as any).paragraphs;
    if (!Array.isArray(arr)) return undefined;
    return {
      paragraphs: arr.map((p: any) => ({
        citations: Array.isArray(p?.citations) ? p.citations : [],
      })),
    };
  } catch {
    return undefined;
  }
}

function trimTrailingLineBreaks(p: HTMLElement): void {
  let node: any = p.lastChild as any;
  while (node) {
    if ((node as any).nodeType === 3) {
      const txt = String((node as any).textContent || "").replace(/\u00a0/g, " ");
      if (/^\s*$/.test(txt)) {
        const prev = (node as any).previousSibling as any;
        p.removeChild(node as any);
        node = prev;
        continue;
      }
      break;
    }
    const tag = ((node as any).tagName || "").toLowerCase();
    if (tag === "br") {
      const prev = (node as any).previousSibling as any;
      p.removeChild(node as any);
      node = prev;
      continue;
    }
    break;
  }
}

function parseInlineCitationsArray(text: string): CitationTarget[] | undefined {
  if (!text) return undefined;
  const trimmed = text.trim();
  // Allow either a single object or an array of objects
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
          quote: typeof (c as any)?.quote === "string" ? (c as any).quote : undefined,
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
