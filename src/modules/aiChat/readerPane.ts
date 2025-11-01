import { config } from "../../../package.json";
import type { FluentMessageId } from "../../../typings/i10n";
import { getLocaleID, getString } from "../../utils/locale";
import {
  appendMessage,
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

type SectionHookArgs = _ZoteroTypes.ItemPaneManagerSection.SectionHookArgs;
type SectionInitHookArgs =
  _ZoteroTypes.ItemPaneManagerSection.SectionInitHookArgs;

const PANE_ID = "ai-chat";
const PaneIcons = {
  header: `chrome://${config.addonRef}/content/icons/favicon.png`,
  sidenav: `chrome://${config.addonRef}/content/icons/favicon@0.5x.png`,
} as const;

const ROLE_LABELS: Record<SessionMessage["role"], string> = {
  user: "我",
  assistant: "AI",
  system: "系统",
};

interface MessageDom {
  container: HTMLDivElement;
  content: HTMLDivElement;
  roleLabel: HTMLSpanElement;
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
  private readonly messageNodes = new Map<string, MessageDom>();

  private sessionId?: string;
  private isContextLoading = false;
  private isSending = false;
  private contextAttachmentKey?: string;
  private contextLoadPromise?: Promise<void>;

  constructor(body: HTMLDivElement) {
    this.body = body;
    const doc = this.getDocument();
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

    this.inputEl = doc.createElement("textarea");
    this.inputEl.classList.add("ai-chat-input");
    this.inputEl.placeholder = getString("ai-chat-input-placeholder");
    this.inputEl.rows = 3;
    this.inputEl.style.resize = "vertical";
    this.inputEl.style.width = "100%";
    this.inputEl.style.boxSizing = "border-box";
    this.inputEl.style.padding = "8px";
    this.inputEl.style.borderRadius = "6px";

    this.sendButton = doc.createElement("button");
    this.sendButton.classList.add("ai-chat-send-button");
    this.sendButton.textContent = getString("ai-chat-send-button");
    this.sendButton.style.alignSelf = "flex-end";
    this.sendButton.style.padding = "6px 14px";

    inputWrapper.appendChild(this.inputEl);
    inputWrapper.appendChild(this.sendButton);

    container.appendChild(this.statusEl);
    container.appendChild(this.errorEl);
    container.appendChild(this.messagesEl);
    container.appendChild(inputWrapper);

    body.replaceChildren(container);

    this.sendButton.addEventListener("click", (event: MouseEvent) => {
      event.preventDefault();
      void this.handleSubmit();
    });

    this.inputEl.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Enter" && event.shiftKey) {
        event.preventDefault();
        void this.handleSubmit();
      }
    });
  }

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

  onDestroy(
    _props: _ZoteroTypes.ItemPaneManagerSection.BasicHookArgs,
  ): void {
    this.messageNodes.clear();
    this.sessionId = undefined;
    this.contextAttachmentKey = undefined;
    this.isContextLoading = false;
    this.isSending = false;
  }

  private assignSession(props: SectionHookArgs): void {
    const sessionId = this.computeSessionId(props);
    if (!sessionId) {
      return;
    }

    if (this.sessionId !== sessionId) {
      this.sessionId = sessionId;
      this.contextAttachmentKey = undefined;
      this.messageNodes.clear();
      this.messagesEl.replaceChildren(this.placeholderEl);
      ensureSession(sessionId);
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
      message.role === "user" ? "rgba(0, 122, 204, 0.12)" : "rgba(0, 0, 0, 0.05)";

    const roleLabel = doc.createElement("span");
    roleLabel.classList.add("ai-chat-message-role");
    roleLabel.style.fontSize = "12px";
    roleLabel.style.fontWeight = "bold";
    roleLabel.style.color = "rgba(0, 0, 0, 0.65)";

    const content = doc.createElement("div");
    content.classList.add("ai-chat-message-content");
    content.style.whiteSpace = "pre-wrap";
    content.style.lineHeight = "1.5";

    container.appendChild(roleLabel);
    container.appendChild(content);

    const entry: MessageDom = { container, content, roleLabel };
    this.messageNodes.set(message.id, entry);
    return entry;
  }

  private updateMessageDom(entry: MessageDom, message: SessionMessage): void {
    entry.roleLabel.textContent = ROLE_LABELS[message.role] ?? message.role;
    entry.content.textContent = message.content;
    entry.container.dataset.role = message.role;
    entry.container.style.backgroundColor =
      message.role === "user"
        ? "rgba(0, 122, 204, 0.12)"
        : message.role === "assistant"
          ? "rgba(92, 184, 92, 0.12)"
          : "rgba(0, 0, 0, 0.05)";
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
    this.isSending = true;

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

    try {
      const response = await sendChat({
        messages: providerMessages,
        onToken: (token) => {
          aggregatedText += token;
          updateMessage(this.sessionId!, assistantMessage.id, (message) => ({
            ...message,
            content: aggregatedText,
            timestamp: message.timestamp,
          }));

          const entry = this.messageNodes.get(assistantMessage.id);
          if (entry) {
            entry.content.textContent = aggregatedText;
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
      this.handleSendError(error, assistantMessage.id);
      state = setSessionStatus(this.sessionId, "idle");
    } finally {
      this.updateStatusDisplay(state);
      this.isSending = false;
    }
  }

  private handleSendError(error: unknown, assistantMessageId: string): void {
    let messageKey: FluentMessageId = "ai-chat-error-server";
    if (error instanceof ProviderError) {
      messageKey = (error.messageKey ?? "ai-chat-error-server") as FluentMessageId;
      ztoolkit.log("[ai-chat] ProviderError", {
        code: error.code,
        status: error.status,
        message: error.message,
        cause: error.cause,
      });
    } else {
      ztoolkit.log("[ai-chat] 未知发送错误", error);
    }

    this.showError(getString(messageKey));

    removeMessage(this.sessionId!, assistantMessageId);
    this.refreshMessages();
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
      const attachmentIds = attachments.map((item) => item.id).sort((a, b) => a - b);
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
          const item = (await Zotero.Items.getAsync(reader.itemID)) as Zotero.Item;
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
          if (attachment?.isAttachment?.() && this.isPdfAttachment(attachment)) {
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
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
