/** Inline citation controller wiring click/keyboard events to Reader navigation. */
/** Callback used to dispose controller-bound listeners. */
export type Dispose = () => void;

/** Dependencies required when delegating citation navigation behavior. */
export interface CitationDeps {
  getTarget: (refEl: HTMLElement) => {
    attachmentID: number;
    page: number;
    quote?: string;
  } | undefined;
  navigate: (
    doc: Document,
    attachmentID: number,
    page: number,
    quote?: string,
  ) => Promise<void> | void;
}

/**
 * Attach inline citation listeners to the chat message list.
 *
 * @param doc - Pane document hosting the chat pane.
 * @param messagesEl - Root list element containing message bubbles.
 * @param handlerOrDeps - Either a handler invoked with the citation element
 * or an object describing how to resolve and navigate to citation targets.
 * @returns Dispose handle to remove the listeners.
 */
export function initCitationController(
  doc: Document,
  messagesEl: HTMLElement,
  handlerOrDeps:
    | ((refEl: HTMLElement) => void | Promise<void>)
    | CitationDeps,
): Dispose {
  const invoke =
    typeof handlerOrDeps === "function"
      ? handlerOrDeps
      : (el: HTMLElement) => {
          const target = handlerOrDeps.getTarget(el);
          if (!target) return;
          return handlerOrDeps.navigate(doc, target.attachmentID, target.page, target.quote);
        };

  const onClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const el = target.closest(".zorecto-cite-ref") as HTMLElement | null;
    if (!el) return;
    event.preventDefault();
    void invoke(el);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter") return;
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const el = target.closest(".zorecto-cite-ref") as HTMLElement | null;
    if (!el) return;
    event.preventDefault();
    void invoke(el);
  };

  messagesEl.addEventListener("click", onClick);
  messagesEl.addEventListener("keydown", onKeyDown);

  return () => {
    try {
      messagesEl.removeEventListener("click", onClick);
      messagesEl.removeEventListener("keydown", onKeyDown);
    } catch {}
  };
}
