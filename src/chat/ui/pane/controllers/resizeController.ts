export type Dispose = () => void;

export interface ResizeOptions {
  minHeight: number;
  maxHeight?: number;
  onResizeEnd?: () => void;
}

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
    const dy = startY - ev.clientY; // drag upwards → increase height
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

