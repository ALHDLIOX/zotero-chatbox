/** Message list controller: bridges session state and the message view adapter. */
import { MessageView, type MessageDom } from "../messages/messageView";
import type { SessionMessage, SessionState } from "../../../services/session/sessionStore";

/** Coordinates placeholder visibility and message view updates within the pane. */
export class MessageListController {
  private readonly doc: Document;
  private readonly root: HTMLDivElement;
  private readonly placeholder: HTMLDivElement;
  private readonly view: MessageView;

  constructor(
    doc: Document,
    root: HTMLDivElement,
    placeholder: HTMLDivElement,
    onCopy: (messageId: string) => void,
    onNote: (messageId: string) => void,
  ) {
    this.doc = doc;
    this.root = root;
    this.placeholder = placeholder;
    this.view = new MessageView(doc, onCopy, onNote);
  }

  renderAll(session: SessionState): void {
    const hasMessages = (session.messages?.length || 0) > 0;
    this.placeholder.hidden = hasMessages;
    this.root.textContent = "";
    if (!hasMessages) {
      this.root.appendChild(this.placeholder);
      return;
    }
    for (const m of session.messages) {
      // Hide system messages from the chat view (e.g., Document Context)
      if (m.role === "system") continue;
      const entry = this.view.ensureMessageDom(m);
      this.view.updateMessageDom(entry, m);
      this.root.appendChild(entry.container);
    }
  }

  ensureAndAppend(message: SessionMessage): MessageDom {
    const entry = this.view.ensureMessageDom(message);
    this.view.updateMessageDom(entry, message);
    this.root.appendChild(entry.container);
    return entry;
  }

  updateEntryByMessage(message: SessionMessage): void {
    const entry = this.view.get(message.id);
    if (!entry) return;
    this.view.updateMessageDom(entry, message);
  }

  scheduleRender(messageId: string, content: string): void {
    const entry = this.view.get(messageId);
    if (!entry) return;
    this.view.scheduleMessageRender(messageId, entry, content);
  }

  getCitationTarget(el: HTMLElement) {
    return this.view.getCitationTarget(el);
  }

  getEntryForId(id: string): { latestContent?: string } | undefined {
    const entry = this.view.get(id);
    return entry ? { latestContent: entry.latestContent } : undefined;
  }

  clear(): void {
    this.view.clear();
    this.placeholder.hidden = false;
    this.root.textContent = "";
    this.root.appendChild(this.placeholder);
  }

  /** Keep viewport pinned to bottom. */
  scrollToBottom(): void {
    try {
      this.root.scrollTop = this.root.scrollHeight;
    } catch {}
  }
}
