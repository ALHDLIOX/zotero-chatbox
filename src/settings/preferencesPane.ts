/** Registers the preferences pane entry (about:addons). */
import { getString } from "../shared/locale";

export const BasicExampleFactory = {
  registerPrefs(): void {
    Zotero.PreferencePanes.register({
      pluginID: addon.data.config.addonID,
      src: rootURI + "content/preferences.xhtml",
      label: getString("prefs-title"),
      image: `chrome://${addon.data.config.addonRef}/content/icons/favicon.svg`,
    });
  },
};
