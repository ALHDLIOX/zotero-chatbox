import { config } from "../../../package.json";
import type { FluentMessageId } from "../../../typings/i10n";
import { getLocaleID, getString } from "../../utils/locale";
import {
  appendMessage,
  clearMessages,
  ensureSession,
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
import { getSelectedPresetId, setSelectedPresetId } from "./prefs";
import { PRESETS, getPresetById } from "./providersRegistry";
import { ensurePaneStyles } from "./ui/styles";
import { MessageView } from "./ui/messageView";
import { copyText } from "./services/clipboard";
import { buildContextMessage, loadContextForProps } from "./services/context";
import { getActiveReader, openReaderAndNavigate } from "./services/readerNav";
import { resolveSessionAndScope } from "./services/sessionOps";

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
// Shoelace removed: no theme/autoloader

const ROLE_LABELS: Record<SessionMessage["role"], string> = {
  user: "我",
  assistant: "AI",
  system: "系统",
};

import type { MessageDom } from "./ui/messageView";

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
  private readonly containerEl: HTMLDivElement;
  private readonly dialogEl: HTMLDivElement;
  private readonly resizeHandleEl: HTMLDivElement;
  private readonly statusEl: HTMLDivElement;
  private readonly messagesEl: HTMLDivElement;
  private readonly placeholderEl: HTMLDivElement;
  private readonly errorEl: HTMLDivElement;
  private readonly inputEl: HTMLTextAreaElement;
  private readonly dialogMinHeight = 180; // px
  private readonly dialogDefaultHeight = 360; // px
  private inputMinHeight = 0;
  private readonly inputMaxHeight = 200; // px
  private readonly sendButton: HTMLButtonElement;
  private readonly clearButton: HTMLButtonElement;
  private readonly presetWrapper: HTMLDivElement;
  private readonly presetButton: HTMLButtonElement;
  private readonly presetMenu: HTMLUListElement;
  private readonly messageView: MessageView;
  private sendIconPlane?: SVGSVGElement;
  private sendIconStop?: SVGSVGElement;

  private sessionId?: string;
  private isContextLoading = false;
  private isSending = false;
  private currentAbortController?: AbortController;
  private currentScopeKey?: string;
  private contextAttachmentKey?: string;
  private contextLoadPromise?: Promise<void>;
  private pendingRenderHandle?: number; // kept to avoid widespread removal; unused after refactor

  constructor(body: HTMLDivElement) {
    this.body = body;
    const doc = this.getDocument();
    // Inject pane styles (scoped base + component) and KaTeX CSS
    ensurePaneStyles(doc, CHAT_STYLESHEET_HREF, KATEX_STYLESHEET_HREF);
    this.messageView = new MessageView(doc, (messageId) => {
      void this.copyAssistantMessage(messageId);
    });
    // Root container + fixed-height dialog wrapper
    const container = ztoolkit.UI.createElement(doc, "div", {
      classList: ["ai-chat-pane"],
    });
    this.containerEl = container;
    const dialog = ztoolkit.UI.createElement(doc, "div", {
      classList: ["ai-chat-dialog"],
    });
    this.dialogEl = dialog as HTMLDivElement;

    // Status bar
    this.statusEl = ztoolkit.UI.createElement(doc, "div", {
      classList: ["ai-chat-status"],
      properties: { textContent: getString("ai-chat-status-loading") },
    });

    // Error banner (plain div)
    this.errorEl = ztoolkit.UI.createElement(doc, "div", {
      classList: ["ai-chat-error"],
      properties: { hidden: true },
    });

    // Messages container + placeholder
    this.messagesEl = ztoolkit.UI.createElement(doc, "div", {
      classList: ["ai-chat-messages"],
    });
    this.placeholderEl = ztoolkit.UI.createElement(doc, "div", {
      classList: ["ai-chat-empty-placeholder"],
      properties: { textContent: getString("ai-chat-empty-placeholder") },
    });
    this.messagesEl.appendChild(this.placeholderEl);

    // Toolbar row (outside input wrapper): Model preset capsule
    const inputWrapper = ztoolkit.UI.createElement(doc, "div", {
      classList: ["ai-chat-input-wrapper"],
    });
    const toolbarRow = ztoolkit.UI.createElement(doc, "div", {
      classList: ["ai-chat-toolbar"],
    });
    // Preset dropdown: custom button + menu to keep styling consistent
    this.presetWrapper = ztoolkit.UI.createElement(doc, "div", {
      classList: ["ai-chat-preset-wrapper"],
    });
    this.presetButton = ztoolkit.UI.createElement(doc, "button", {
      classList: ["ai-chat-preset-button"],
      properties: { type: "button" } as any,
      attributes: {
        "aria-haspopup": "listbox",
        "aria-expanded": "false",
      },
    }) as unknown as HTMLButtonElement;
    // Inner label span for ellipsis control
    const presetLabel = doc.createElement("span");
    presetLabel.className = "ai-chat-preset-button__label";
    this.presetButton.appendChild(presetLabel);
    this.presetMenu = ztoolkit.UI.createElement(doc, "ul", {
      classList: ["ai-chat-preset-menu"],
      properties: { hidden: true },
      attributes: { role: "listbox" },
    }) as unknown as HTMLUListElement;
    this.presetWrapper.appendChild(this.presetButton);
    this.presetWrapper.appendChild(this.presetMenu);

    // Populate menu items
    const currentId = getPresetById(getSelectedPresetId())?.id ?? PRESETS[0].id;
    for (const p of PRESETS) {
      const li = ztoolkit.UI.createElement(doc, "li", {
        classList: [
          "ai-chat-preset-option",
          p.id === currentId ? "ai-chat-preset-option--selected" : undefined,
        ].filter(Boolean) as string[],
        attributes: { role: "option", "data-id": p.id },
        properties: { textContent: p.label },
        listeners: [
          {
            type: "click",
            listener: () => this.selectPreset(p.id),
          },
        ],
      });
      this.presetMenu.appendChild(li);
    }
    this.updatePresetButtonLabel(currentId);
    this.presetButton.addEventListener("click", () => this.togglePresetMenu());
    // Dismiss when clicking outside
    doc.addEventListener("click", (ev) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      if (target.closest && target.closest(".ai-chat-preset-wrapper")) return;
      this.closePresetMenu();
    });
    // Keyboard support
    this.presetButton.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.openPresetMenu();
        const first = this.presetMenu.querySelector(
          ".ai-chat-preset-option",
        ) as HTMLElement | null;
        first?.focus?.();
      }
    });
    this.presetMenu.addEventListener("keydown", (e: KeyboardEvent) => {
      const items = Array.from(
        this.presetMenu.querySelectorAll<HTMLElement>(".ai-chat-preset-option"),
      );
      const active = this.getDocument().activeElement as HTMLElement | null;
      const idx = Math.max(0, items.indexOf(active || items[0]!));
      if (e.key === "Escape") {
        this.closePresetMenu();
        this.presetButton.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIdx = Math.min(items.length - 1, idx + 1);
        const next = items[nextIdx];
        if (next) (next as any)?.focus?.();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIdx = Math.max(0, idx - 1);
        const prev = items[prevIdx];
        if (prev) (prev as any)?.focus?.();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const el = this.getDocument().activeElement as HTMLElement | null;
        const id = el?.getAttribute("data-id");
        if (id) this.selectPreset(id);
      }
    });
    toolbarRow.appendChild(this.presetWrapper);

    // Input textarea (no visible label)
    const inputId = `ai-chat-input-${Math.random().toString(36).slice(2, 10)}`;
    this.inputEl = ztoolkit.UI.createElement(doc, "textarea", {
      classList: ["ai-chat-input"],
      properties: {
        id: inputId,
        placeholder: getString("ai-chat-input-placeholder"),
        rows: 1,
      } as any,
      attributes: {
        "aria-label": getString("ai-chat-input-label"),
      },
    }) as unknown as HTMLTextAreaElement;

    // Buttons
    this.sendButton = ztoolkit.UI.createElement(doc, "button", {
      classList: ["ai-chat-send-button"],
      properties: { type: "button", title: "Send" } as any,
    });
    this.clearButton = ztoolkit.UI.createElement(doc, "button", {
      classList: ["ai-chat-clear-button"],
      properties: { type: "button", title: "Clear" } as any,
    });
    const buttonRow = ztoolkit.UI.createElement(doc, "div", {
      classList: ["ai-chat-button-row"],
    });
    buttonRow.appendChild(this.clearButton);
    buttonRow.appendChild(this.sendButton);
    // Icons (SVG inline): Ant Design style icons
    try {
      // Send icon (Ant Design SendOutlined style - paper plane)
      const plane = doc.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      ) as unknown as SVGSVGElement;
      plane.setAttribute("viewBox", "0 0 1024 1024");
      plane.setAttribute("width", "16");
      plane.setAttribute("height", "16");
      plane.setAttribute("aria-hidden", "true");
      plane.setAttribute("fill", "currentColor");
      plane.style.display = "block";
      const p = doc.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", "M931.4 498.9L94.9 79.5c-3.4-1.7-7.3-2.1-11-1.2-8.5 2.1-13.8 10.7-11.7 19.3l86.2 352.2c1.3 5.3 5.2 9.6 10.4 11.3l147.7 50.7-147.6 50.7c-5.2 1.8-9.1 6.1-10.4 11.3L72.2 926.5c-.9 3.7-.5 7.6 1.2 10.9 3.9 7.9 13.5 11.1 21.5 7.2l836.5-417c3.1-1.5 5.6-4.1 7.2-7.1 3.9-8 .7-17.6-7.2-21.6zM170.8 826.3l50.3-205.6 295.2-101.3c2.3-.8 4.2-2.6 5-5 1.4-4.2-.8-8.7-5-10.2L221.1 403.3l-50.3-205.6L845.2 512 170.8 826.3z");
      p.setAttribute("fill", "currentColor");
      plane.appendChild(p);
      this.sendIconPlane = plane;

      // Stop icon (rounded square)
      const stop = doc.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      ) as unknown as SVGSVGElement;
      stop.setAttribute("viewBox", "0 0 1024 1024");
      stop.setAttribute("width", "16");
      stop.setAttribute("height", "16");
      stop.setAttribute("aria-hidden", "true");
      stop.setAttribute("fill", "currentColor");
      stop.style.display = "block";
      const stopRect = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
      stopRect.setAttribute("x", "256");
      stopRect.setAttribute("y", "256");
      stopRect.setAttribute("width", "512");
      stopRect.setAttribute("height", "512");
      stopRect.setAttribute("rx", "64");
      stopRect.setAttribute("ry", "64");
      stopRect.setAttribute("fill", "currentColor");
      stop.appendChild(stopRect);
      this.sendIconStop = stop;

      // Delete icon (Ant Design DeleteOutlined style - trash can)
      const deleteIcon = doc.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      ) as unknown as SVGSVGElement;
      deleteIcon.setAttribute("viewBox", "0 0 1024 1024");
      deleteIcon.setAttribute("width", "16");
      deleteIcon.setAttribute("height", "16");
      deleteIcon.setAttribute("aria-hidden", "true");
      deleteIcon.setAttribute("fill", "currentColor");
      deleteIcon.style.display = "block";
      const deletePath = doc.createElementNS("http://www.w3.org/2000/svg", "path");
      deletePath.setAttribute("d", "M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z");
      deletePath.setAttribute("fill", "currentColor");
      deleteIcon.appendChild(deletePath);
      this.clearButton.replaceChildren(deleteIcon);

      // mount send icons: keep both and toggle hidden
      if (this.sendIconPlane) this.sendButton.appendChild(this.sendIconPlane);
      if (this.sendIconStop) this.sendButton.appendChild(this.sendIconStop);
      if (this.sendIconStop) (this.sendIconStop.style as any).display = "none";
    } catch (e) {
      this.sendButton.textContent = "✈";
      this.clearButton.textContent = "🗑";
    }

    // Compose input wrapper
    inputWrapper.appendChild(this.inputEl);
    inputWrapper.appendChild(buttonRow);

    // Mount fixed-height dialog and resizer
    dialog.appendChild(this.messagesEl);
    dialog.appendChild(toolbarRow);
    dialog.appendChild(inputWrapper);

    // Resize handle (thin horizontal bar)
    const handle = ztoolkit.UI.createElement(doc, "div", {
      classList: ["ai-chat-resize-handle"],
      attributes: { role: "separator", "aria-orientation": "vertical" },
    });
    this.resizeHandleEl = handle as HTMLDivElement;

    // Mount container
    container.appendChild(this.statusEl);
    container.appendChild(this.errorEl);
    container.appendChild(dialog);
    container.appendChild(handle);
    // Mount into pane body
    body.replaceChildren(container);

    // Initial height
    this.dialogEl.style.height = `${this.dialogDefaultHeight}px`;
    this.initResizeHandle();

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

    // Auto-resize textarea on input
    this.inputEl.addEventListener("input", () => this.autoResizeInput());
    // Initialize size after DOM mount
    setTimeout(() => this.initInputAutoSize(), 0);

    this.setSendingState(false);
  }

  // Preset dropdown helpers
  private updatePresetButtonLabel(presetId: string): void {
    const preset = getPresetById(presetId) ?? PRESETS[0];
    const labelEl = this.presetButton.querySelector(
      ".ai-chat-preset-button__label",
    ) as HTMLSpanElement | null;
    if (labelEl) labelEl.textContent = preset.label;
    else this.presetButton.textContent = preset.label;
  }

  private openPresetMenu(): void {
    this.presetMenu.hidden = false;
    this.presetButton.setAttribute("aria-expanded", "true");
  }

  private closePresetMenu(): void {
    if (this.presetMenu.hidden) return;
    this.presetMenu.hidden = true;
    this.presetButton.setAttribute("aria-expanded", "false");
  }

  private togglePresetMenu(): void {
    if (this.presetMenu.hidden) this.openPresetMenu();
    else this.closePresetMenu();
  }

  private selectPreset(presetId: string): void {
    setSelectedPresetId(presetId);
    this.updatePresetButtonLabel(presetId);
    const items = this.presetMenu.querySelectorAll(".ai-chat-preset-option");
    for (let i = 0; i < items.length; i++) {
      const el = items[i] as HTMLElement;
      if (el.getAttribute("data-id") === presetId)
        el.classList.add("ai-chat-preset-option--selected");
      else el.classList.remove("ai-chat-preset-option--selected");
    }
    this.closePresetMenu();
  }

  // Styles are handled via ensurePaneStyles() in constructor

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
    if (!this.sessionId) return;
    this.isContextLoading = true;
    if (!this.isSending) {
      this.statusEl.textContent = getString("ai-chat-status-loading");
    }
    this.contextLoadPromise = loadContextForProps(
      this.sessionId,
      props,
      this.getDocument(),
      this.contextAttachmentKey,
    )
      .then(({ updated, key }) => {
        this.contextAttachmentKey = key || undefined;
        this.updateStatusDisplay(updated);
      })
      .catch((error) => {
        ztoolkit.log("[ai-chat] 加载上下文失败", error);
      })
      .finally(() => {
        this.isContextLoading = false;
        if (this.sessionId) this.updateStatusDisplay(ensureSession(this.sessionId));
      });
    try {
      await this.contextLoadPromise;
    } catch {}
  }

  onItemChange(props: SectionHookArgs): void {
    this.assignSession(props);
    this.refreshMessages();
    if (!this.sessionId) return;
    this.isContextLoading = true;
    if (!this.isSending) {
      this.statusEl.textContent = getString("ai-chat-status-loading");
    }
    this.contextLoadPromise = loadContextForProps(
      this.sessionId,
      props,
      this.getDocument(),
      this.contextAttachmentKey,
    )
      .then(({ updated, key }) => {
        this.contextAttachmentKey = key || undefined;
        this.updateStatusDisplay(updated);
      })
      .catch((error) => {
        ztoolkit.log("[ai-chat] 刷新上下文失败", error);
      })
      .finally(() => {
        this.isContextLoading = false;
        if (this.sessionId) this.updateStatusDisplay(ensureSession(this.sessionId));
      });
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
    this.messageView.clear();
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
    const { sessionId, scopeKey, isNewSessionId, isScopeChanged, session } =
      resolveSessionAndScope(
        props,
        this.getDocument(),
        this.sessionId,
        this.currentScopeKey,
      );
    if (!sessionId) return;

    if (isNewSessionId) {
      this.sessionId = sessionId;
    }
    if (isNewSessionId || isScopeChanged) {
      this.currentScopeKey = scopeKey;
      this.contextAttachmentKey = undefined;
      this.messageView.clear();
      this.messagesEl.replaceChildren(this.placeholderEl);
      this.clearError();
      this.isSending = false;
      this.currentAbortController = undefined;
      this.updateActionButtonLabel();
      this.clearButton.disabled = true;
    }
    if (session && (isNewSessionId || isScopeChanged)) {
      this.updateClearButtonState(session);
      this.placeholderEl.hidden = session.messages.length > 0;
    }
  }

  // computeSessionId/computeScopeKey moved to services/sessionOps

  private refreshMessages(): void {
    if (!this.sessionId) {
      return;
    }

    const session = ensureSession(this.sessionId);
    const existingIds = new Set(this.messageView.keys());

    for (const message of session.messages) {
      const entry = this.messageView.ensureMessageDom(message);
      this.messageView.updateMessageDom(entry, message);
      this.messagesEl.appendChild(entry.container);
      existingIds.delete(message.id);
    }

    for (const messageId of existingIds) {
      const entry = this.messageView.get(messageId as string);
      if (entry) entry.container.remove();
      this.messageView.delete(messageId as string);
    }

    this.placeholderEl.hidden = session.messages.length > 0;
    this.updateClearButtonState(session);
  }

  // Message DOM/Render logic moved to MessageView

  private async handleCitationActivate(refEl: HTMLElement): Promise<void> {
    const target = this.messageView.getCitationTarget(refEl);
    if (!target || !Number.isFinite(target.attachmentID) || !Number.isFinite(target.page)) {
      return;
    }
    try {
      await openReaderAndNavigate(this.getDocument(), target.attachmentID!, target.page!, target.quote);
    } catch (error) {
      ztoolkit.log("[ai-chat] 引用跳转失败", { error, target });
    }
  }

  // Reader navigation utilities moved to services/readerNav

  private async copyAssistantMessage(messageId: string): Promise<void> {
    try {
      const session = this.sessionId ? getSession(this.sessionId) : undefined;
      const message = session?.messages.find((item) => item.id === messageId);
      const entry = this.messageView.get(messageId);
      const content = message?.content ?? entry?.latestContent ?? "";
      if (!content.trim()) {
        ztoolkit.log("[ai-chat] 无可复制的文本", { messageId });
        return;
      }
      await copyText(this.getDocument(), content);
    } catch (error) {
      ztoolkit.log("[ai-chat] 复制消息失败", { messageId, error });
    }
  }

  private scheduleMessageRender(
    messageId: string,
    entry: MessageDom,
    content: string,
    options?: { suppressMathError?: boolean },
  ): void {
    this.messageView.scheduleMessageRender(messageId, entry, content, options);
  }

  private flushRenderQueue(): void {
    this.messageView.flushRenderQueue();
  }

  private clearPendingRenders(): void {
    this.messageView.clearPendingRenders();
  }

  private updateActionButtonLabel(): void {
    // icon-only; keep accessible title only
    this.sendButton.title = this.isSending ? "Stop" : "Send";
    this.sendButton.dataset.mode = this.isSending ? "stop" : "send";
    this.sendButton.classList.toggle(
      "ai-chat-send-button--stop",
      this.isSending,
    );
    // toggle icons
    try {
      if (this.sendIconPlane && this.sendIconStop) {
        (this.sendIconPlane.style as any).display = this.isSending ? "none" : "";
        (this.sendIconStop.style as any).display = this.isSending ? "" : "none";
      }
    } catch {}
  }

  private initInputAutoSize(): void {
    try {
      const style = this.getDocument().defaultView?.getComputedStyle?.(this.inputEl);
      const line = style ? parseFloat(style.lineHeight || "0") : 0;
      this.inputMinHeight = Math.max(this.inputEl.scrollHeight, Math.round(line * 2.6) || 48);
    } catch {
      this.inputMinHeight = this.inputEl.scrollHeight || 48;
    }
    this.autoResizeInput();
  }

  private initResizeHandle(): void {
    const doc = this.getDocument();
    let dragging = false;
    let startY = 0;
    let startHeight = 0;

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const dy = e.clientY - startY;
      const containerRect = this.containerEl.getBoundingClientRect();
      const handleRect = this.resizeHandleEl.getBoundingClientRect();
      const maxHeight = Math.max(
        this.dialogMinHeight,
        Math.min(
          containerRect.height - (handleRect.height + 8),
          9999,
        ),
      );
      const target = Math.max(this.dialogMinHeight, Math.min(startHeight + dy, maxHeight));
      this.dialogEl.style.height = `${Math.round(target)}px`;
    };

    const stop = () => {
      if (!dragging) return;
      dragging = false;
      doc.removeEventListener("mousemove", onMouseMove);
      doc.removeEventListener("mouseup", stop);
    };

    this.resizeHandleEl.addEventListener("mousedown", (e: MouseEvent) => {
      dragging = true;
      startY = e.clientY;
      startHeight = this.dialogEl.getBoundingClientRect().height;
      doc.addEventListener("mousemove", onMouseMove);
      doc.addEventListener("mouseup", stop, { once: true });
      e.preventDefault();
    });
  }

  private autoResizeInput(): void {
    const el = this.inputEl;
    el.style.resize = "none"; // disable manual resize
    el.style.overflowY = "auto";
    el.style.maxHeight = `${this.inputMaxHeight}px`;
    el.style.height = "auto";
    const target = Math.min(this.inputMaxHeight, Math.max(this.inputMinHeight, el.scrollHeight));
    el.style.height = `${target}px`;
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
    this.autoResizeInput();
    this.clearError();
    this.setSendingState(true);

    appendMessage(this.sessionId, userMessage);
    this.refreshMessages();

    let state = setSessionStatus(this.sessionId, "sending");
    this.updateStatusDisplay(state);

    const contextMessage = buildContextMessage(this.sessionId);
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

          const entry = this.messageView.get(assistantMessage.id);
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

  // buildContextMessage moved to services/context

  // loadContext moved to services/context

  // Attachment helpers and reader getter moved to services

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

// Unused citation helpers removed or moved to MessageView
