/** Welcome placeholder controller: builds and toggles welcome block. */
import { buildWelcomeBlock } from "../elements/welcomeBlock";

/** Manages the welcome placeholder content and its visibility. */
export class WelcomeController {
  private readonly doc: Document;
  private readonly placeholderEl: HTMLDivElement;
  private mounted = false;

  constructor(doc: Document, placeholderEl: HTMLDivElement) {
    this.doc = doc;
    this.placeholderEl = placeholderEl;
  }

  mount(onAsk: (q: string) => void): void {
    if (this.mounted) return;
    try {
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

  show(): void {
    (this.placeholderEl as any).hidden = false;
  }

  hide(): void {
    (this.placeholderEl as any).hidden = true;
  }
}
