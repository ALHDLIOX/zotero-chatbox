export type Dispose = () => void;

export function initCitationController(
  doc: Document,
  messagesEl: HTMLElement,
  onActivateRef: (refEl: HTMLElement) => void | Promise<void>,
): Dispose {
  const onClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const el = target.closest(".zorecto-cite-ref") as HTMLElement | null;
    if (!el) return;
    event.preventDefault();
    void onActivateRef(el);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter") return;
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const el = target.closest(".zorecto-cite-ref") as HTMLElement | null;
    if (!el) return;
    event.preventDefault();
    void onActivateRef(el);
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

