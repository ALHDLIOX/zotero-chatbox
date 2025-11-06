/** DOM view helper for chat messages and actions. */
import type { SessionMessage } from "../../state/sessionStore";
import type { CitationTarget } from "../../render/shared";
import type { MessageDom, RenderOptions } from "./types";
import { createMessageDom } from "./dom/messageDom";
import { renderMessageContent as renderContent } from "./render/messageRenderer";
import { getCitationTarget as getCitation, applyCitations } from "./citations/citations";
import { RafBatcher } from "./util/rafBatcher";

export type { MessageDom } from "./types";

// MessageDom moved to src/chat/ui/messages/types.ts


export class MessageView {
  private readonly doc: Document;
  private readonly onCopy: (messageId: string) => void;
  private readonly onNote?: (messageId: string) => void;
  private readonly messageNodes = new Map<string, MessageDom>();
  private readonly batcher: RafBatcher<{
    entry: MessageDom;
    content: string;
    options?: RenderOptions;
  }>;

  constructor(
    doc: Document,
    onCopy: (messageId: string) => void,
    onNote?: (messageId: string) => void,
  ) {
    this.doc = doc;
    this.onCopy = onCopy;
    this.onNote = onNote;
    this.batcher = new RafBatcher(this.doc, (items) => {
      for (const item of items) {
        this.renderMessageContent(item.entry, item.content, item.options);
      }
    });
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
    const entry = createMessageDom(this.doc, message, this.onCopy, this.onNote);
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
    options?: RenderOptions,
  ): void {
    this.batcher.queue(messageId, { entry, content, options });
    this.batcher.schedule();
  }

  flushRenderQueue(): void {
    this.batcher.flush();
  }

  clearPendingRenders(): void {
    this.batcher.clear();
  }

  getCitationTarget(refEl: HTMLElement): CitationTarget | undefined {
    return getCitation(refEl);
  }

  private renderMessageContent(
    entry: MessageDom,
    content: string,
    options?: RenderOptions,
  ): void {
    renderContent(this.doc, entry, content, options);
  }

  // applyMathErrorState moved to renderer; retained here only via import for API locality.

  // Parse inline citation markers and render small numeric buttons in-place
  private applyCitations(entry: MessageDom, content: string): void {
    applyCitations(this.doc, entry, content);
  }
}
