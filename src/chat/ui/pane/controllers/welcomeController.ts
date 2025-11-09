/** Welcome placeholder controller: builds and toggles welcome block. */
import { buildWelcomeBlock } from "../../controls/welcomeBlock";

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
      const w = this.doc.createElement("div");
      w.className = "zorecto-welcome";
      w.textContent = "Welcome";
      this.placeholderEl.appendChild(w);
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

