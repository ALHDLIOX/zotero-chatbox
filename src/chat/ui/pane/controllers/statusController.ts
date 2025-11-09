/** Status bar controller: encapsulates status text and insertion. */
import { getString } from "../../../../shared/locale";
import { createStatusBar } from "../../controls/statusBar";

export class StatusController {
  private readonly doc: Document;
  private readonly el: HTMLDivElement;

  constructor(doc: Document, dialogEl: HTMLDivElement) {
    this.doc = doc;
    this.el = createStatusBar(this.doc, getString("zorecto-status-loading"));
    try {
      dialogEl.insertBefore(this.el, dialogEl.firstChild);
    } catch {
      dialogEl.appendChild(this.el);
    }
  }

  setLoading(): void {
    this.setText(getString("zorecto-status-loading"));
  }

  setSending(): void {
    this.setText(getString("zorecto-status-sending"));
  }

  setReady(): void {
    this.setText(getString("zorecto-status-loaded"));
  }

  setMissing(): void {
    this.setText(getString("zorecto-status-missing"));
  }

  setText(text: string): void {
    this.el.textContent = text;
  }
}

