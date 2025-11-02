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
  private readonly statusEl: HTMLDivElement;
  private readonly messagesEl: HTMLDivElement;
  private readonly placeholderEl: HTMLDivElement;
  private readonly errorEl: HTMLDivElement;
  private readonly inputEl: HTMLTextAreaElement;
  private readonly sendButton: HTMLButtonElement;
  private readonly clearButton: HTMLButtonElement;
  private readonly presetSelect: HTMLSelectElement;
  private readonly messageView: MessageView;

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
    ensurePaneStyles(doc, CHAT_STYLESHEET_HREF, KATEX_STYLESHEET_HREF);
    this.messageView = new MessageView(doc, (messageId) => {
      void this.copyAssistantMessage(messageId);
    });
    const container = doc.createElement("div");
    container.classList.add("ai-chat-pane");

    this.statusEl = doc.createElement("div");
    this.statusEl.classList.add("ai-chat-status");
    this.statusEl.textContent = getString("ai-chat-status-loading");

    this.errorEl = doc.createElement("div");
    this.errorEl.classList.add("ai-chat-error");
    this.errorEl.hidden = true;

    this.messagesEl = doc.createElement("div");
    this.messagesEl.classList.add("ai-chat-messages");

    this.placeholderEl = doc.createElement("div");
    this.placeholderEl.classList.add("ai-chat-empty-placeholder");
    this.placeholderEl.textContent = getString("ai-chat-empty-placeholder");
    this.messagesEl.appendChild(this.placeholderEl);

    const inputWrapper = doc.createElement("div");
    inputWrapper.classList.add("ai-chat-input-wrapper");

    // Settings row: Provider + Model selector (applies globally)
    const settingsRow = doc.createElement("div");
    settingsRow.classList.add("ai-chat-settings-row");

    const presetLabel = doc.createElement("label");
    presetLabel.textContent = getString("ai-chat-model-label");
    // keep semantic styling via CSS

    this.presetSelect = doc.createElement("select");
    this.presetSelect.classList.add("ai-chat-preset-select");

    // Populate options with fallback labels (no preferences.ftl in this view)
    this.presetSelect.textContent = "";
    for (const p of PRESETS) {
      const opt = doc.createElement("option");
      opt.value = p.id;
      opt.textContent = p.label;
      this.presetSelect.appendChild(opt);
    }
    const currentId = getPresetById(getSelectedPresetId())?.id ?? PRESETS[0].id;
    this.presetSelect.value = currentId;

    this.presetSelect.addEventListener("change", () => {
      setSelectedPresetId(this.presetSelect.value);
    });

    settingsRow.appendChild(presetLabel);
    settingsRow.appendChild(this.presetSelect);

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

    this.sendButton = doc.createElement("button");
    this.sendButton.classList.add("ai-chat-send-button");

    this.clearButton = doc.createElement("button");
    this.clearButton.classList.add("ai-chat-clear-button");
    this.clearButton.textContent = getString("ai-chat-clear-button");

    const buttonRow = doc.createElement("div");
    buttonRow.classList.add("ai-chat-button-row");

    buttonRow.appendChild(this.clearButton);
    buttonRow.appendChild(this.sendButton);

    inputWrapper.appendChild(settingsRow);
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
