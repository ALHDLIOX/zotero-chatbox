import { attachAutoResize } from "../../utils/inputAutoResize";
import { buildActionButtons } from "../../controls/actionButtons";
import { getString } from "../../../../shared/locale";

export type Dispose = () => void;

export interface InputCallbacks {
  onSubmit: (content: string) => void;
  onAbort: () => void;
  onClear: () => void;
}

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
    this.inputEl = ztoolkit.UI.createElement(doc, "textarea", {
      classList: ["zorecto-input"],
      properties: {
        id: inputId,
        placeholder: getString("zorecto-input-placeholder"),
        rows: 1,
      } as any,
      attributes: {
        "aria-label": getString("zorecto-input-label"),
      },
    }) as unknown as HTMLTextAreaElement;

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

    mount.appendChild(this.inputEl);
    mount.appendChild(actions.row);

    try { this._auto = attachAutoResize(this.inputEl, { maxHeight: opts.maxHeight ?? 200 }); } catch {}

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" && event.shiftKey) {
        event.preventDefault();
        const content = (this.inputEl.value || "").trim();
        if (!content) return;
        this.inputEl.value = "";
        try { this._auto?.resizeNow(); } catch {}
        callbacks.onSubmit(content);
      }
    };
    this.inputEl.addEventListener("keydown", onKey);
    this._disposeKey = () => this.inputEl.removeEventListener("keydown", onKey);
  }

  setMode(m: "send" | "stop") { try { this._setMode?.(m); } catch {} }
  focus() { try { this.inputEl.focus(); } catch {} }
  setValue(text: string) { this.inputEl.value = text; try { this._auto?.resizeNow(); } catch {} }
  getAndClear(): string { const t = (this.inputEl.value || "").trim(); this.inputEl.value = ""; try { this._auto?.resizeNow(); } catch {}; return t; }
  resizeNow(): void { try { this._auto?.resizeNow(); } catch {} }
  dispose(): void { try { this._disposeKey?.(); this._auto?.detach(); } catch {} }
}
