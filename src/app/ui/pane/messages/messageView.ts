/**
 * MessageView – lightweight view adapter for chat messages inside the pane.
 *
 * Purpose
 * - Maintain a stable mapping: message.id → MessageDom
 * - Create/update DOM for each message and batch incremental re-renders
 * - Toggle assistant-only actions and math error banner
 * - Integrate inline citations rendering and lookups
 *
 * Non-goals
 * - Business logic (copy, notes) – handled by controllers
 * - Data/state management – handled by session services and chatPaneController
 */
import type { SessionMessage } from "../../../services/session/sessionFacade";
import type { CitationTarget } from "../../../render/shared/parsing/cite";
import type { MessageDom, RenderOptions } from "./types";
import { createMessageDom, renderMessageContent as renderContent } from "./messageRenderer";
import { getCitationTarget as getCitation } from "../../../render/chat/citationTargets";
import { RafBatcher } from "../../utils/rafBatcher";

export type { MessageDom } from "./types";

// MessageDom is defined at src/app/ui/pane/messages/types.ts

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

  /**
   * Construct the view adapter.
   * @param doc - Pane document used for DOM operations
   * @param onCopy - Handler for assistant Copy button
   * @param onNote - Handler for assistant Add-to-Notes button
   */
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

  /** All currently tracked message ids (in insertion order). */
  keys(): IterableIterator<string> {
    return this.messageNodes.keys();
  }

  /** Resolve the cached DOM entry for a message id (if any). */
  get(messageId: string): MessageDom | undefined {
    return this.messageNodes.get(messageId);
  }

  /** Drop a message id → DOM mapping (does not detach DOM from tree). */
  delete(messageId: string): void {
    this.messageNodes.delete(messageId);
  }

  /** Clear all mappings and any pending rAF-batched renders. */
  clear(): void {
    this.messageNodes.clear();
    this.clearPendingRenders();
  }

  /** Ensure a DOM entry exists for the message; returns the cached/created entry. */
  ensureMessageDom(message: SessionMessage): MessageDom {
    const existing = this.messageNodes.get(message.id);
    if (existing) return existing;
    const entry = createMessageDom(this.doc, message, this.onCopy, this.onNote);
    this.messageNodes.set(message.id, entry);
    return entry;
  }

  /**
   * Update the DOM entry content and assistant-only UI for a message.
   * Invokes inline citations decoration for assistant messages with content.
   */
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

    // Inline citations are now rendered during inline token rendering via CiteToken.
  }

  /** Queue a content diff to be rendered on next animation frame (dedup by messageId). */
  scheduleMessageRender(
    messageId: string,
    entry: MessageDom,
    content: string,
    options?: RenderOptions,
  ): void {
    this.batcher.queue(messageId, { entry, content, options });
    this.batcher.schedule();
  }

  /** Force-flush any queued renders now. */
  flushRenderQueue(): void {
    this.batcher.flush();
  }

  /** Cancel any queued renders and clear the batcher. */
  clearPendingRenders(): void {
    this.batcher.clear();
  }

  /** Public helper used by controllers to resolve the target of a citation badge element. */
  getCitationTarget(refEl: HTMLElement): CitationTarget | undefined {
    return getCitation(refEl);
  }

  /** Render content and propagate options to the renderer. */
  private renderMessageContent(
    entry: MessageDom,
    content: string,
    options?: RenderOptions,
  ): void {
    renderContent(this.doc, entry, content, options);
  }

  // applyMathErrorState moved to renderer; retained here only via import for API locality.

  // Inline citations are handled in chat inline renderer; retained no-op slot for API locality.
}
