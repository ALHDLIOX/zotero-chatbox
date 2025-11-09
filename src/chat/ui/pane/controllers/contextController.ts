/** Context controller: load and cache document context for current scope. */
import type { SessionState } from "../../../state/sessionStore";
import { loadContextForProps } from "../../../services/documentContext";
import { StatusController } from "./statusController";

/** Loads Reader context metadata and updates the status bar accordingly. */
export class ContextController {
  private readonly doc: Document;
  private readonly status: StatusController;
  private attachmentKey?: string;
  public isLoading = false;

  constructor(doc: Document, status: StatusController) {
    this.doc = doc;
    this.status = status;
  }

  getKey(): string | undefined {
    return this.attachmentKey;
  }

  /**
   * Refresh context for given pane props; optionally show loading state.
   * Returns the updated session state.
   */
  async refresh(
    sessionId: string,
    props: _ZoteroTypes.ItemPaneManagerSection.SectionHookArgs,
    opts: { showLoading?: boolean } = {},
  ): Promise<SessionState> {
    const showLoading = opts.showLoading !== false;
    this.isLoading = true;
    try {
      if (showLoading) this.status.setLoading();
    } catch {}

    try {
      const { updated, key } = await loadContextForProps(
        sessionId,
        props,
        this.doc,
        this.attachmentKey,
      );
      this.attachmentKey = key || undefined;
      return updated;
    } finally {
      this.isLoading = false;
      try {
        if (showLoading) this.status.setReady();
      } catch {}
    }
  }
}
