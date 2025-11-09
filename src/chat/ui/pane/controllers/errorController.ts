/** Error banner controller: show/hide error messages in the pane. */
import { getString } from "../../../../shared/locale";
import { ProviderError } from "../../../providers";

export class ErrorController {
  private readonly el: HTMLDivElement;

  constructor(errorEl: HTMLDivElement) {
    this.el = errorEl;
    try {
      (this.el as any).hidden = true;
    } catch {}
  }

  hide(): void {
    try {
      (this.el as any).hidden = true;
      this.el.textContent = "";
    } catch {}
  }

  show(message: string): void {
    try {
      this.el.textContent = message;
      (this.el as any).hidden = false;
    } catch {}
  }

  showFromError(error: unknown): void {
    // Prefer localized short message if this is a ProviderError
    if (error instanceof ProviderError) {
      try {
        const localized = getString(error.messageKey as any);
        if (localized && String(localized).trim()) {
          this.show(localized);
          return;
        }
      } catch {}
      this.show(error.message || String(error));
      return;
    }
    this.show(String((error as any)?.message || error || "Error"));
  }
}

