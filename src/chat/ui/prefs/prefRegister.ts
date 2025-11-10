/**
 * Preferences pane registrar.
 *
 * Purpose: Register the add-on's preferences pane in `about:addons` with
 * localized label and icon. This file contains no UI logic.
 * Dependencies: Zotero host APIs (`Zotero.PreferencePanes`) and
 * `shared/locale.getString` for the label.
 * Invariants: Only called once during startup.
 */
import { getString } from "../../../shared/locale";

/**
 * Register the preferences page with Zotero's PreferencePanes registry.
 */
export function registerPreferencesPane(): void {
  Zotero.PreferencePanes.register({
    pluginID: addon.data.config.addonID,
    src: rootURI + "content/preferences.xhtml",
    label: getString("prefs-title"),
    image: `chrome://${addon.data.config.addonRef}/content/icons/favicon.svg`,
  });
}
