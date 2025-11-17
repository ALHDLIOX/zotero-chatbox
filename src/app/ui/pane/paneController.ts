/** Chat pane controller (Presenter) responsible for wiring UI and chat flow. */
import { config } from "../../../../package.json";
import {
  clearSessionMessages,
  ensureSessionExists,
  resolveSessionForPane,
  type SessionState,
} from "../../services/session/sessionFacade";
import { ensurePaneStyles } from "./paneStyles";
import { buildChatPane } from "../pane/paneView";
import { MessageListController } from "./controllers/messageListController";
import { initResizeController, type Dispose } from "./controllers/resizeController";
import { initCitationController } from "./controllers/citationController";
import { PresetController } from "./controllers/presetController";
import { StatusController } from "./controllers/statusController";
import { WelcomeController } from "./controllers/welcomeController";
import { ErrorController } from "./controllers/errorController";
import { ContextController } from "./controllers/contextController";
import { SendController } from "./controllers/sendController";
import { InputController } from "./controllers/inputController";
import { copyAssistantMessageById, addAssistantMessageToNotesById } from "./controllers/messageActionsController";
import { openReaderAndNavigate } from "../../services/readerNavigation";

type SectionHookArgs = _ZoteroTypes.ItemPaneManagerSection.SectionHookArgs;
type SectionInitHookArgs = _ZoteroTypes.ItemPaneManagerSection.SectionInitHookArgs;

const CHAT_STYLESHEET_HREF = `chrome://${config.addonRef}/content/pane/pane.css`;
const KATEX_STYLESHEET_HREF = `chrome://${config.addonRef}/content/vendor/katex.min.css`;

/**
 * Presenter for the Reader side pane. Assembles UI controllers/services and
 * forwards Zotero pane lifecycle events without embedding business logic.
 */
export class chatPaneController {
  private readonly body: HTMLDivElement;
  private readonly dialogEl: HTMLDivElement;
  private readonly messagesEl: HTMLDivElement;
  private readonly placeholderEl: HTMLDivElement;
  private readonly inputEl: HTMLTextAreaElement;
  private readonly dialogMinHeight = 180; // px
  private readonly dialogDefaultHeight = 720; // px
  private readonly inputMaxHeight = 200; // px
  private readonly presetCtrl: PresetController;
  private readonly inputCtrl: InputController;
  private readonly messageList: MessageListController;
  private readonly statusCtrl: StatusController;
  private readonly welcomeCtrl: WelcomeController;
  private readonly errorCtrl: ErrorController;
  private readonly contextCtrl: ContextController;
  private readonly sendCtrl: SendController;
  // No per-message icons kept here; buttons are handled within sub-controllers

  private sessionId?: string;
  private isSending = false;
  private currentScopeKey?: string;
  private contextLoadPromise?: Promise<void>;
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
    // Use view.container directly; no need to store as a field
    this.dialogEl = view.dialog;
    this.messagesEl = view.messages;
    this.placeholderEl = view.placeholder;
    // error element is managed by ErrorController; no local field kept
    try {
      this.dialogEl.style.height = `${this.dialogDefaultHeight}px`;
    } catch {}

    // Controllers for status/welcome/error
    this.statusCtrl = new StatusController(this.dialogEl);
    this.errorCtrl = new ErrorController(view.error);

    // Placeholder content (welcome)
    this.welcomeCtrl = new WelcomeController(doc, this.placeholderEl);
    this.welcomeCtrl.mount((q) => this.handleQuickAsk(q));
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
      onSubmit: (content) => { try { this.welcomeCtrl.hide(); } catch {}; void this.handleSubmitText(content); },
      onAbort: () => this.handleAbort(),
      onClear: () => this.handleClear(),
    }, { maxHeight: this.inputMaxHeight });
    this.inputEl = this.inputCtrl.inputEl;

    // Layout tree (already assembled in view)
    this.body.appendChild(view.container);

    // Citations controller: resolve target + navigate internally
    this.disposeCitations = initCitationController(doc, this.messagesEl, {
      getTarget: (el) => this.messageList.getCitationTarget(el),
      navigate: (d, attachmentID, page, quote) =>
        openReaderAndNavigate(d, attachmentID, page, quote),
    });

    this.setSendingState(false);
    // Bind resize controller
    this.disposeResize = initResizeController(doc, this.dialogEl, view.resizeHandle, {
      minHeight: this.dialogMinHeight,
      onResizeEnd: () => this.inputCtrl.resizeNow(),
    });
    // Initial status: assume ready until context loader updates it
    this.statusCtrl.setReady();

    // Context & send controllers
    this.contextCtrl = new ContextController(doc, this.statusCtrl);
    this.sendCtrl = new SendController(doc, {
      messageList: this.messageList,
    });
  }

  /** Resolve pane document */
  private getDocument(): Document {
    return (this.body.ownerDocument as Document);
  }

  /** Toggle send/stop visual mode and internal flag */
  private setSendingState(isSending: boolean): void {
    this.isSending = isSending;
    const showStop = isSending;
    try {
      const mode = showStop ? "stop" : "send";
      this.inputCtrl.setMode(mode);
    } catch {}
    try {
      if (isSending) this.statusCtrl.setSending();
      else if (this.contextCtrl.isLoading) this.statusCtrl.setLoading();
      else this.statusCtrl.setReady();
    } catch {}
  }

  /** Update status bar reflecting loading vs. ready state */
  private updateStatusDisplay(session: SessionState): void {
    if (this.isSending) return;
    try {
      if (this.contextCtrl.isLoading) this.statusCtrl.setLoading();
      else this.statusCtrl.setReady();
    } catch {}
  }

  /** Resolve session/scope for current pane body and ensure a live session */
  private assignSession(props: SectionHookArgs | SectionInitHookArgs): void {
    const doc = this.getDocument();
    const { sessionId, scopeKey } = resolveSessionForPane(
      props,
      doc,
      this.sessionId,
      this.currentScopeKey,
    );
    this.sessionId = sessionId;
    this.currentScopeKey = scopeKey;
    if (sessionId) ensureSessionExists(sessionId);
  }

  /** Re-render message list (or welcome placeholder) and auto-scroll */
  private refreshMessages(): void {
    const session = this.sessionId ? ensureSessionExists(this.sessionId) : undefined;
    if (!session) {
      // Use view adapter to reset to placeholder state
      try {
        this.messageList.clear();
      } catch {
        this.messagesEl.replaceChildren(this.placeholderEl);
      }
      return;
    }
    this.messageList.renderAll(session);
    this.messageList.scrollToBottom();
  }

  // Scrolling behavior is delegated to MessageListController

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
    if (!content) return;

    // Clear previous error banner on new submission
    try { this.errorCtrl.hide(); } catch {}

    this.setSendingState(true);

    try {
      await this.sendCtrl.submit(this.sessionId, content);
      this.setSendingState(false);
      this.updateStatusDisplay(ensureSessionExists(this.sessionId));
    } catch (error) {
      this.setSendingState(false);
      try { this.statusCtrl.setMissing(); } catch {}
      try { this.errorCtrl.showFromError(error); } catch {}
      this.messageList.scrollToBottom();
    } finally {
      // no-op
    }
  }

  /** Abort current streaming request (if any) and restore UI */
  private async handleAbort(): Promise<void> {
    try { this.sendCtrl.abort(); } catch {}
    this.setSendingState(false);
    if (this.sessionId) this.updateStatusDisplay(ensureSessionExists(this.sessionId));
  }

  /** Clear current session messages and restore placeholder */
  private handleClear(): void {
    if (!this.sessionId) return;
    const session = ensureSessionExists(this.sessionId);
    if (!session || session.messages.length === 0) return;
    clearSessionMessages(this.sessionId);
    this.messageList.clear();
    try {
      // After clearing, show and refresh welcome cards with new randomized suggestions
      this.welcomeCtrl.show();
      this.welcomeCtrl.refresh((q) => this.handleQuickAsk(q));
    } catch {}
    this.focusInput();
  }

  // Citation navigation is handled within CitationController

  /** Dispose controllers and listeners */
  onDestroy(_props: unknown): void {
    try { this.inputCtrl.dispose(); } catch {}
    try { this.disposeResize?.(); } catch {}
    try { this.disposeCitations?.(); } catch {}
  }

  /** Quick ask from welcome block: auto-send instead of just filling */
  private handleQuickAsk(template: string): void {
    const text = (template || "").trim();
    if (!text) return;
    // Fill input and focus, but do NOT auto-send
    try { this.inputCtrl.setValue(text); } catch {}
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
    const session = this.sessionId ? ensureSessionExists(this.sessionId) : undefined;
    if (session) {
      this.updateStatusDisplay(session);
    }
  }

  /** Pane lifecycle: async render – (re)load context text if needed */
  async onAsyncRender(props: SectionHookArgs): Promise<void> {
    this.assignSession(props);
    if (!this.sessionId) return;
    this.contextLoadPromise = this.contextCtrl
      .refresh(this.sessionId, props, { showLoading: !this.isSending })
      .then((updated) => {
        this.updateStatusDisplay(updated);
      })
      .catch((error) => {
        ztoolkit.log("[zorecto] 加载上下文失败", error);
      })
      .finally(() => {
        if (this.sessionId) this.updateStatusDisplay(ensureSessionExists(this.sessionId));
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
    this.contextLoadPromise = this.contextCtrl
      .refresh(this.sessionId, props, { showLoading: !this.isSending })
      .then((updated) => {
        this.updateStatusDisplay(updated);
      })
      .catch((error) => {
        ztoolkit.log("[zorecto] 刷新上下文失败", error);
      })
      .finally(() => {
        if (this.sessionId) this.updateStatusDisplay(ensureSessionExists(this.sessionId));
      });
  }
}
