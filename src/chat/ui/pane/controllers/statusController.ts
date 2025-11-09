/** Status bar controller: encapsulates status text and insertion. */
import { getString } from "../../../../shared/locale";
import { createStatusBarProps } from "../../controls/statusBar";

/** Displays localized status text at the top of the chat pane dialog. */
export class StatusController {
  private readonly el: HTMLDivElement;

  constructor(dialogEl: HTMLDivElement) {
    const loadingText = getString("zorecto-status-loading");
    const firstElement = dialogEl.firstElementChild ?? undefined;
    const inserted =
      firstElement &&
      ztoolkit.UI.insertElementBefore(createStatusBarProps(loadingText), firstElement);
    this.el = (
      inserted ??
      ztoolkit.UI.appendElement(createStatusBarProps(loadingText), dialogEl)
    ) as HTMLDivElement;
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
