/**
 * Placeholder registration for the AI Chat reader pane section.
 * Phase 3 will provide the actual ItemPane wiring and UI rendering.
 */
let hasRegistered = false;

export const AI_CHAT_SECTION_ID = "ai-chat-sidebar";

export async function registerAIChatReaderPane(): Promise<void> {
  if (hasRegistered) {
    return;
  }

  // Registration logic will be implemented in later tasks.
  hasRegistered = true;
}
