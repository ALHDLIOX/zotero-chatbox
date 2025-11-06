/** Reader pane registration for the chat panel in Zotero. */
import { config } from "../../../../package.json";
import { getLocaleID } from "../../../shared/locale";
import { chatPaneController } from "./chatPaneController";

const PANE_ID = "zorecto";
const PaneIcons = {
  header: `chrome://${config.addonRef}/content/icons/favicon.svg`,
  sidenav: `chrome://${config.addonRef}/content/icons/favicon.svg`,
} as const;

const paneControllers = new WeakMap<HTMLDivElement, chatPaneController>();

export async function registerzoRectoReaderPane(): Promise<void> {
  const result = Zotero.ItemPaneManager.registerSection({
    paneID: PANE_ID,
    pluginID: config.addonID,
    header: {
      l10nID: getLocaleID("zorecto-pane-header"),
      icon: PaneIcons.header,
    },
    sidenav: {
      l10nID: getLocaleID("zorecto-pane-sidenav"),
      icon: PaneIcons.sidenav,
    },
    onInit: (props) => getController(props.body).onInit(props as any),
    onRender: (props) => getController(props.body).onRender(props as any),
    onAsyncRender: (props) => getController(props.body).onAsyncRender(props as any),
    onItemChange: (props) => getController(props.body).onItemChange(props as any),
    onDestroy: (props) => {
      const controller = paneControllers.get(props.body);
      controller?.onDestroy?.(props as any);
      paneControllers.delete(props.body);
    },
  });

  if (result === false) {
    ztoolkit.log("[zorecto] 注册 zoRecto 聊天面板失败：paneID 已存在");
  }
}

function getController(body: HTMLDivElement): chatPaneController {
  let controller = paneControllers.get(body);
  if (!controller) {
    controller = new chatPaneController(body);
    paneControllers.set(body, controller);
  }
  return controller;
}

