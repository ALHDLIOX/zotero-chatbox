/**
 * DOM handles associated with a single chat message bubble.
 * These are created once per message id and reused for updates.
 */
export interface MessageDom {
  container: HTMLDivElement;
  content: HTMLDivElement;
  roleLabel: HTMLSpanElement;
  mathError: HTMLDivElement;
  actions?: HTMLDivElement;
  copyButton?: HTMLButtonElement;
  noteButton?: HTMLButtonElement;
  latestContent?: string;
}

/** Options to tweak content rendering behavior for a message. */
export interface RenderOptions {
  suppressMathError?: boolean;
}
