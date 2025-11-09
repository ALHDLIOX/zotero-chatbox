/** Context controller: load and cache document context for current scope. */
import type { SessionState } from "../../../state/sessionStore";
import { createContextLoader } from "../../../services/documentContext";
import { StatusController } from "./statusController";

/** Loads Reader context metadata and updates the status bar accordingly. */
export class ContextController {
  private readonly doc: Document;
  private readonly status: StatusController;
  private readonly loader: ReturnType<typeof createContextLoader>;
  public isLoading = false;

  constructor(doc: Document, status: StatusController) {
    this.doc = doc;
    this.status = status;
    this.loader = createContextLoader(doc);
  }

  // No external key exposure; the service keeps its cache internally

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
      const updated = await this.loader.refresh(sessionId, props);
      return updated;
    } finally {
      this.isLoading = false;
      try {
        if (showLoading) this.status.setReady();
      } catch {}
    }
  }
}
