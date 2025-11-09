/** Input controller: manages textarea, resize behavior, and action buttons. */
import { attachAutoResize } from "../../utils/inputAutoResize";
import { buildActionButtons } from "../../controls/actionButtons";
import { getString } from "../../../../shared/locale";

/** Disposable callback for cleaning up controller resources. */
export type Dispose = () => void;

/** Callback bag used to communicate user actions back to the presenter. */
export interface InputCallbacks {
  onSubmit: (content: string) => void;
  onAbort: () => void;
  onClear: () => void;
}

/** Manages the chat input textarea, hotkeys, and action buttons. */
export class InputController {
  readonly inputEl: HTMLTextAreaElement;
  private readonly doc: Document;
  private readonly wrapper: HTMLDivElement;
  private _auto?: { detach: () => void; resizeNow: () => void };
  private _setMode?: (m: "send" | "stop") => void;
  private _disposeKey?: () => void;

  constructor(
    doc: Document,
    mount: HTMLDivElement,
    callbacks: InputCallbacks,
    opts: { maxHeight?: number } = {},
  ) {
    this.doc = doc;
    this.wrapper = mount;

    const inputId = `zorecto-input-${Math.random().toString(36).slice(2, 10)}`;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" && event.shiftKey) {
        event.preventDefault();
        const target = event.currentTarget as HTMLTextAreaElement | null;
        const input = target ?? this.inputEl;
        const content = (input?.value || "").trim();
        if (!content) return;
        if (input) input.value = "";
        try { this._auto?.resizeNow(); } catch {}
        callbacks.onSubmit(content);
      }
    };
    const maxH = opts.maxHeight ?? 200;
    this.inputEl = ztoolkit.UI.appendElement(
      {
        tag: "textarea",
        classList: ["zorecto-input"],
        properties: {
          id: inputId,
          placeholder: getString("zorecto-input-placeholder"),
          rows: 1,
        } as any,
        attributes: {
          "aria-label": getString("zorecto-input-label"),
        },
        styles: {
          resize: "none",
          overflowY: "auto",
          maxHeight: `${maxH}px`,
        } as any,
        listeners: [
          { type: "keydown", listener: onKey },
        ],
      },
      mount,
    ) as unknown as HTMLTextAreaElement;

    const actions = buildActionButtons(doc, {
      onSend: () => {
        const content = (this.inputEl.value || "").trim();
        if (!content) return;
        this.inputEl.value = "";
        try { this._auto?.resizeNow(); } catch {}
        callbacks.onSubmit(content);
      },
      onStop: () => callbacks.onAbort(),
      onClear: () => callbacks.onClear(),
    });
    this._setMode = actions.setMode;

    // input 已通过 UITool 挂载；actions 行暂保留原生挂载
    mount.appendChild(actions.row);

    try { this._auto = attachAutoResize(this.inputEl, { maxHeight: opts.maxHeight ?? 200 }); } catch {}

    // keydown 监听已通过 UITool 注册
    this._disposeKey = undefined;
  }

  setMode(m: "send" | "stop"): void {
    try {
      this._setMode?.(m);
    } catch {}
  }

  focus(): void {
    try {
      this.inputEl.focus();
    } catch {}
  }

  setValue(text: string): void {
    this.inputEl.value = text;
    try {
      this._auto?.resizeNow();
    } catch {}
  }

  getAndClear(): string {
    const value = (this.inputEl.value || "").trim();
    this.inputEl.value = "";
    try {
      this._auto?.resizeNow();
    } catch {}
    return value;
  }

  resizeNow(): void {
    try {
      this._auto?.resizeNow();
    } catch {}
  }

  dispose(): void {
    try {
      this._disposeKey?.();
      this._auto?.detach();
    } catch {}
  }
}
