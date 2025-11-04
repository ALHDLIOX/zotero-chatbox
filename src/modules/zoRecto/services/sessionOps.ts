import { ensureSessionScope, type SessionState } from "../session";
import { getActiveReader } from "./readerNav";

export function computeSessionId(
  props: _ZoteroTypes.ItemPaneManagerSection.SectionHookArgs,
  doc: Document,
  currentSessionId?: string,
): string | undefined {
  const win = (doc.defaultView || undefined) as
    | (Window & { Zotero_Tabs?: any; ZoteroPane?: any })
    | undefined;
  if (props.tabType === "reader") {
    const tabID = win?.Zotero_Tabs?.selectedID;
    if (tabID) return `reader-${tabID}`;
  }

  if (props.item?.isAttachment?.()) {
    const windowId = win?.ZoteroPane?.id ?? "attachment-pane";
    return `attachment-${props.item.id}-${windowId}`;
  }

  if (props.item?.isRegularItem?.()) {
    const windowId = win?.ZoteroPane?.id ?? "library-pane";
    return `item-${props.item.id}-${windowId}`;
  }

  return currentSessionId;
}

export function computeScopeKey(
  props: _ZoteroTypes.ItemPaneManagerSection.SectionHookArgs,
  doc: Document,
): string | undefined {
  const win = (doc.defaultView || undefined) as | (Window & { ZoteroPane?: any }) | undefined;
  const windowId = win?.ZoteroPane?.id ?? "main-window";

  if (props.tabType === "reader") {
    const reader = getActiveReader(doc);
    if (reader) return `reader:${reader.itemID}:${windowId}`;
  }

  if (props.item?.isAttachment?.()) {
    return `attachment:${props.item.id}:${windowId}`;
  }

  if (props.item?.isRegularItem?.()) {
    return `item:${props.item.id}:${windowId}`;
  }

  return undefined;
}

export function resolveSessionAndScope(
  props: _ZoteroTypes.ItemPaneManagerSection.SectionHookArgs,
  doc: Document,
  currentSessionId?: string,
  currentScopeKey?: string,
): {
  sessionId?: string;
  scopeKey?: string;
  isNewSessionId: boolean;
  isScopeChanged: boolean;
  session?: SessionState;
} {
  const sessionId = computeSessionId(props, doc, currentSessionId);
  if (!sessionId) {
    return {
      sessionId,
      scopeKey: currentScopeKey,
      isNewSessionId: false,
      isScopeChanged: false,
      session: undefined,
    };
  }

  const scopeKey = computeScopeKey(props, doc) ?? sessionId;
  const isNewSessionId = currentSessionId !== sessionId;
  const isScopeChanged = currentScopeKey !== scopeKey;
  const session = ensureSessionScope(sessionId, scopeKey);

  return { sessionId, scopeKey, isNewSessionId, isScopeChanged, session };
}

