/** Welcome placeholder controller: builds and toggles welcome block. */
import { buildWelcomeBlock } from "../elements/welcomeBlock";

/** Manages the welcome placeholder content and its visibility. */
export class WelcomeController {
  private readonly doc: Document;
  private readonly placeholderEl: HTMLDivElement;
  private mounted = false;
  private onAsk?: (q: string) => void;

  constructor(doc: Document, placeholderEl: HTMLDivElement) {
    this.doc = doc;
    this.placeholderEl = placeholderEl;
  }

  mount(onAsk: (q: string) => void): void {
    if (this.mounted) return;
    try {
      this.onAsk = onAsk;
      const block = buildWelcomeBlock(this.doc, onAsk);
      this.placeholderEl.appendChild(block);
      this.mounted = true;
    } catch {
      // Fallback minimal content
      ztoolkit.UI.appendElement(
        {
          tag: "div",
          classList: ["zorecto-welcome"],
          properties: { textContent: "Welcome" },
        },
        this.placeholderEl,
      );
      this.mounted = true;
    }
  }

  /** Rebuild the welcome block with freshly randomized suggestions. */
  refresh(onAsk?: (q: string) => void): void {
    try {
      if (onAsk) this.onAsk = onAsk;
      // Clear existing content and rebuild
      this.placeholderEl.textContent = "";
      const block = buildWelcomeBlock(this.doc, this.onAsk || (() => {}));
      this.placeholderEl.appendChild(block);
    } catch {}
  }

  show(): void {
    (this.placeholderEl as any).hidden = false;
  }

  hide(): void {
    (this.placeholderEl as any).hidden = true;
  }
}
