/** Chat pane controller (Presenter) responsible for wiring UI and chat flow. */
import { config } from "../../../../package.json";
import { getString } from "../../../shared/locale";
import {
  appendMessage,
  clearMessages,
  ensureSession,
  getSession,
  removeMessage,
  setSessionContext,
  setSessionStatus,
  type SessionMessage,
  type SessionState,
} from "../../state/sessionStore";
import { ProviderError } from "../../providers";
import { ensurePaneStyles } from "./paneStyles";
import { buildChatPane } from "../pane/chatPaneView";
import { MessageListController } from "./controllers/messageListController";
import { initResizeController, type Dispose } from "./controllers/resizeController";
import { initCitationController } from "./controllers/citationController";
import { PresetController } from "./controllers/presetController";
import { createStatusBar } from "../controls/statusBar";
import { buildWelcomeBlock } from "../controls/welcomeBlock";
import { InputController } from "./controllers/inputController";
import { copyAssistantMessageById, addAssistantMessageToNotesById } from "../messages/messageActions";
import { copyText } from "../../services/clipboard";
import { buildContextMessage, loadContextForProps } from "../../services/documentContext";
import { getActiveReader, openReaderAndNavigate } from "../../services/readerNavigation";
import { resolveSessionAndScope } from "../../services/sessionScope";
import { renderNoteHtml } from "../../render/note";
import { ChatFlow } from "../../services/chatFlow";

type SectionHookArgs = _ZoteroTypes.ItemPaneManagerSection.SectionHookArgs;
type SectionInitHookArgs =
  _ZoteroTypes.ItemPaneManagerSection.SectionInitHookArgs;

const CHAT_STYLESHEET_HREF = `chrome://${config.addonRef}/content/zorecto.css`;
const KATEX_STYLESHEET_HREF = `chrome://${config.addonRef}/content/vendor/katex.min.css`;

// Presenter for the Reader side pane – assembles controllers/services and
// forwards Zotero pane lifecycle; avoids heavy UI logic here.
export class chatPaneController {
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
  private _inputAuto?: { detach: () => void; resizeNow: () => void };
  private readonly presetCtrl: PresetController;
  private readonly inputCtrl: InputController;
  private readonly messageList: MessageListController;
  private sendIconPlane?: SVGSVGElement;
  private sendIconStop?: SVGSVGElement;

  private sessionId?: string;
  private isContextLoading = false;
  private isSending = false;
  private currentAbortController?: AbortController;
  private chatFlow?: ChatFlow;
  private currentScopeKey?: string;
  private contextAttachmentKey?: string;
  private contextLoadPromise?: Promise<void>;
  private pendingRenderHandle?: number; // kept to avoid widespread removal; unused after refactor
  private disposeResize?: Dispose;
  private disposeCitations?: Dispose;

  /**
   * Constructor
   * Steps
   * 1) Inject styles and build view skeleton
   * 2) Insert status bar and welcome placeholder
   * 3) Mount controllers: MessageList, Preset, Input, Citations, Resize
   * 4) Mount container into the pane body
   */
  constructor(body: HTMLDivElement) {
    this.body = body;
    const doc = this.getDocument();
    // Inject pane styles (scoped base + component) and KaTeX CSS
    ensurePaneStyles(doc, CHAT_STYLESHEET_HREF, KATEX_STYLESHEET_HREF);
    // Build view
    const view = buildChatPane(doc);
    this.containerEl = view.container;
    this.dialogEl = view.dialog;
    this.messagesEl = view.messages;
    this.placeholderEl = view.placeholder;
    this.errorEl = view.error;
    try {
      this.dialogEl.style.height = `${this.dialogDefaultHeight}px`;
    } catch {}

    // Status bar
    this.statusEl = createStatusBar(doc, getString("zorecto-status-loading"));
    try { this.dialogEl.insertBefore(this.statusEl, this.dialogEl.firstChild); } catch { this.dialogEl.appendChild(this.statusEl); }

    // Error banner (plain div)
    this.errorEl = ztoolkit.UI.createElement(doc, "div", {
      classList: ["zorecto-error"],
      properties: { hidden: true },
    });

    // Placeholder content (welcome)
    try {
      const welcome = buildWelcomeBlock(doc, (q) => this.handleQuickAsk(q));
      this.placeholderEl.appendChild(welcome);
    } catch {
      const w = doc.createElement("div");
      w.className = "zorecto-welcome";
      w.textContent = getString("zorecto-welcome-title");
      this.placeholderEl.appendChild(w);
    }
    this.messagesEl.appendChild(this.placeholderEl);
    this.messageList = new MessageListController(
      doc,
      this.messagesEl,
      this.placeholderEl,
      (messageId) => {
        void copyAssistantMessageById(
          this.getDocument(),
          this.sessionId,
          (id) => this.messageList.getEntryForId(id),
          messageId,
        );
      },
      (messageId) => {
        void addAssistantMessageToNotesById(
          this.getDocument(),
          this.sessionId,
          this.currentScopeKey,
          (id) => this.messageList.getEntryForId(id),
          messageId,
        );
      },
    );

    // Toolbar + Input
    this.presetCtrl = new PresetController(doc, view.toolbarRow, (id) => this.selectPreset(id));

    // Input controller (textarea + actions)
    this.inputCtrl = new InputController(doc, view.inputWrapper, {
      onSubmit: (content) => { this.placeholderEl.hidden = true; void this.handleSubmitText(content); },
      onAbort: () => this.handleAbort(),
      onClear: () => this.handleClear(),
    }, { maxHeight: this.inputMaxHeight });
    this.inputEl = this.inputCtrl.inputEl;

    // Resize handle area
    this.resizeHandleEl = ztoolkit.UI.createElement(doc, "div", {
      classList: ["zorecto-resize-handle"],
    });

    // Layout tree (already assembled in view)
    this.body.appendChild(this.containerEl);

    // Citations controller
    this.disposeCitations = initCitationController(doc, this.messagesEl, (el) => this.handleCitationActivate(el));

    this.setSendingState(false);
    // Bind resize controller
    this.disposeResize = initResizeController(doc, this.dialogEl, view.resizeHandle, {
      minHeight: this.dialogMinHeight,
      onResizeEnd: () => this.inputCtrl.resizeNow(),
    });
  }

  /** Resolve pane document */
  private getDocument(): Document {
    return (this.body.ownerDocument as Document);
  }

  /** Resolve pane window */
  private getWindow(): Window {
    return (this.getDocument().defaultView as Window);
  }

  /** Toggle send/stop visual mode and internal flag */
  private setSendingState(isSending: boolean): void {
    this.isSending = isSending;
    const showStop = isSending;
    try {
      const mode = showStop ? "stop" : "send";
      this.inputCtrl.setMode(mode);
    } catch {}
  }

  /** Update status bar reflecting loading vs. ready state */
  private updateStatusDisplay(session: SessionState): void {
    if (!this.isSending) {
      this.statusEl.textContent = this.isContextLoading
        ? getString("zorecto-status-loading")
        : getString("zorecto-status-loaded");
    }
  }

  /** Resolve session/scope for current pane body and ensure a live session */
  private assignSession(props: SectionHookArgs | SectionInitHookArgs): void {
    const doc = this.getDocument();
    const { sessionId, scopeKey } = resolveSessionAndScope(props, doc);
    this.sessionId = sessionId;
    this.currentScopeKey = scopeKey;
    if (sessionId) ensureSession(sessionId);
  }

  /** Re-render message list (or welcome placeholder) and auto-scroll */
  private refreshMessages(): void {
    const session = this.sessionId ? ensureSession(this.sessionId) : undefined;
    if (!session) {
      this.messagesEl.replaceChildren(this.placeholderEl);
      return;
    }
    this.messageList.renderAll(session);
    this.scrollToBottom();
  }

  /** Keep viewport pinned to the latest message */
  private scrollToBottom(): void {
    try {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    } catch {}
  }

  // (resize handled by resizeController)

  /** Bring focus back to textarea */
  private focusInput(): void {
    try {
      this.inputEl.focus();
    } catch {}
  }

  /**
   * Submit pipeline (UI): append user + optional context, then start ChatFlow.
   * Streaming tokens are forwarded to MessageListController for incremental DOM updates.
   */
  private async handleSubmitText(content: string): Promise<void> {
    if (!this.sessionId) return;
    const doc = this.getDocument();
    const win = this.getWindow();
    if (!content) return;

    appendMessage(this.sessionId, {
      id: `${Date.now()}-u`,
      role: "user",
      content,
      timestamp: Date.now(),
    });
    this.messageList.ensureAndAppend(ensureSession(this.sessionId).messages.at(-1)!);

    const context = await buildContextMessage(this.sessionId);
    if (context) appendMessage(this.sessionId, context);

    this.setSendingState(true);
    this.statusEl.textContent = getString("zorecto-status-sending");

    try {
      this.currentAbortController = new AbortController();
    } catch {
      this.currentAbortController = undefined;
    }

    const controller = this.currentAbortController;
    let assistant: SessionMessage | undefined;
    this.chatFlow = new ChatFlow(this.sessionId);

    const onToken = (token: string) => {
      if (!assistant) return;
      assistant.content += token;
      this.messageList.scheduleRender(assistant.id, assistant.content);
      this.scrollToBottom();
    };

    try {
      await this.chatFlow.start({
        onAssistant: (msg) => {
          assistant = { ...msg };
          this.messageList.ensureAndAppend(msg);
          this.scrollToBottom();
        },
        onToken,
        signal: controller?.signal,
      });
      this.setSendingState(false);
      this.updateStatusDisplay(ensureSession(this.sessionId));
    } catch (error) {
      this.setSendingState(false);
      this.statusEl.textContent = getString("zorecto-status-missing");
      if (assistant) this.messageList.updateEntryByMessage(assistant);
      this.scrollToBottom();
    } finally {
      this.currentAbortController = undefined;
      this.chatFlow = undefined;
    }
  }

  /** Abort current streaming request (if any) and restore UI */
  private async handleAbort(): Promise<void> {
    try {
      this.currentAbortController?.abort();
    } catch {}
    try { this.chatFlow?.abort(); } catch {}
    this.setSendingState(false);
    if (this.sessionId) this.updateStatusDisplay(ensureSession(this.sessionId));
  }

  /** Clear current session messages and restore placeholder */
  private handleClear(): void {
    if (!this.sessionId) return;
    const session = ensureSession(this.sessionId);
    if (!session || session.messages.length === 0) return;
    clearMessages(this.sessionId);
    this.messageList.clear();
    this.focusInput();
  }

  /** Navigate to PDF page when an inline citation badge is activated */
  private async handleCitationActivate(refEl: HTMLElement): Promise<void> {
    try {
      const target = this.messageList.getCitationTarget(refEl);
      if (!target) return;
      const doc = this.getDocument();
      await openReaderAndNavigate(doc, target.attachmentID, target.page, target.quote);
      return;
      try {
        const text = getString("zorecto-status-missing");
        const pw = new ztoolkit.ProgressWindow(addon.data.config.addonName, {
          closeOnClick: true,
          closeTime: 2000,
        })
          .createLine({ text, type: "default" })
          .show();
        pw.startCloseTimer(1800);
      } catch {}
    } catch {}
  }

  /** Dispose controllers and listeners */
  onDestroy(_props: unknown): void {
    try { this.inputCtrl.dispose(); } catch {}
    try { this.disposeResize?.(); } catch {}
  }

  /** Fill textarea with a quick template and focus */
  private handleQuickAsk(template: string): void {
    const text = (template || "").trim();
    if (!text) return;
    this.inputCtrl.setValue(text);
    this.focusInput();
  }

  private selectPreset(presetId: string): void {
    try { this.presetCtrl.set(presetId); } catch {}
  }

  // Hooks (called by readerPane wrapper)
  /** Pane lifecycle: initial mount */
  onInit(props: SectionInitHookArgs): void {
    this.assignSession(props);
  }

  /** Pane lifecycle: sync render (called often) */
  onRender(props: SectionHookArgs): void {
    this.assignSession(props);
    this.refreshMessages();
    const session = this.sessionId ? ensureSession(this.sessionId) : undefined;
    if (session) {
      this.updateStatusDisplay(session);
    }
  }

  /** Pane lifecycle: async render – (re)load context text if needed */
  async onAsyncRender(props: SectionHookArgs): Promise<void> {
    this.assignSession(props);
    if (!this.sessionId) return;
    this.isContextLoading = true;
    if (!this.isSending) {
      this.statusEl.textContent = getString("zorecto-status-loading");
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
        ztoolkit.log("[zorecto] 加载上下文失败", error);
      })
      .finally(() => {
        this.isContextLoading = false;
        if (this.sessionId) this.updateStatusDisplay(ensureSession(this.sessionId));
      });
    try {
      await this.contextLoadPromise;
    } catch {}
  }

  /** Pane lifecycle: current item changed → refresh context + messages */
  onItemChange(props: SectionHookArgs): void {
    this.assignSession(props);
    this.refreshMessages();
    if (!this.sessionId) return;
    this.isContextLoading = true;
    if (!this.isSending) {
      this.statusEl.textContent = getString("zorecto-status-loading");
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
        ztoolkit.log("[zorecto] 刷新上下文失败", error);
      })
      .finally(() => {
        this.isContextLoading = false;
        if (this.sessionId) this.updateStatusDisplay(ensureSession(this.sessionId));
      });
  }
}
