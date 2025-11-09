/** Resize controller: handles drag-to-resize interactions for the chat pane. */
/** Dispose callback returned by the resize controller. */
export type Dispose = () => void;

/** Options governing pane sizing behavior. */
export interface ResizeOptions {
  minHeight: number;
  maxHeight?: number;
  onResizeEnd?: () => void;
}

/**
 * Initialize resize drag handlers for the chat pane dialog.
 *
 * @param doc - Document hosting the pane DOM.
 * @param dialogEl - The pane dialog element whose height is adjusted.
 * @param handleEl - Drag handle element.
 * @param opts - Resize configuration.
 * @returns Dispose callback to remove listeners.
 */
export function initResizeController(
  doc: Document,
  dialogEl: HTMLDivElement,
  handleEl: HTMLDivElement,
  opts: ResizeOptions,
): Dispose {
  let isDragging = false;
  let startY = 0;
  let startH = 0;

  const calcMax = () =>
    Math.round(
      Math.max(320, (doc.defaultView?.innerHeight || 800) * 0.8),
    );

  const onMouseMove = (ev: MouseEvent) => {
    if (!isDragging) return;
    // With handle at the bottom, dragging DOWN should increase height
    const dy = ev.clientY - startY; // drag downwards → increase height
    const maxH = opts.maxHeight ?? calcMax();
    const next = Math.min(maxH, Math.max(opts.minHeight, startH + dy));
    dialogEl.style.height = `${next}px`;
  };

  const stop = () => {
    if (!isDragging) return;
    isDragging = false;
    doc.removeEventListener("mousemove", onMouseMove);
    doc.removeEventListener("mouseup", stop, true);
    try {
      opts.onResizeEnd?.();
    } catch {}
  };

  const onDown = (ev: MouseEvent) => {
    isDragging = true;
    startY = ev.clientY;
    startH = dialogEl.getBoundingClientRect().height;
    doc.addEventListener("mousemove", onMouseMove);
    doc.addEventListener("mouseup", stop, true);
    ev.preventDefault();
  };

  handleEl.addEventListener("mousedown", onDown);

  return () => {
    try {
      handleEl.removeEventListener("mousedown", onDown);
      doc.removeEventListener("mousemove", onMouseMove);
      doc.removeEventListener("mouseup", stop, true);
    } catch {}
  };
}
