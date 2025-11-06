/** Attach auto-resize behavior to a textarea element. */
export interface AutoResizeHandle {
  detach(): void;
  resizeNow(): void;
}

export function attachAutoResize(
  textarea: HTMLTextAreaElement,
  opts: { maxHeight?: number } = {},
): AutoResizeHandle {
  const maxH = Math.max(0, opts.maxHeight ?? 200);
  let minH = 48;
  try {
    const style = textarea.ownerDocument?.defaultView?.getComputedStyle?.(textarea);
    const line = style ? parseFloat(style.lineHeight || "0") : 0;
    minH = Math.max(textarea.scrollHeight, Math.round(line * 2.6) || 48);
  } catch {}

  const apply = () => {
    textarea.style.resize = "none";
    textarea.style.overflowY = "auto";
    textarea.style.maxHeight = `${maxH}px`;
    textarea.style.height = "auto";
    const target = Math.min(maxH, Math.max(minH, textarea.scrollHeight));
    textarea.style.height = `${target}px`;
  };

  const onInput = () => apply();
  textarea.addEventListener("input", onInput);
  // Initial
  apply();

  return {
    detach() {
      textarea.removeEventListener("input", onInput);
    },
    resizeNow() {
      apply();
    },
  };
}

