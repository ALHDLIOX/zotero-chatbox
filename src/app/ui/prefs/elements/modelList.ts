/**
 * Preferences model list view helpers.
 *
 * Purpose: Render provider model rows, API key inputs and inline connection status.
 * Dependencies: ztoolkit.UI for DOM creation and Ant icon helpers.
 * Invariants: Stateless beyond DOM mutations; controller owns persistence and IO.
 */
import type { ProviderId, ProviderPreset } from "../../../providers";
import { createAntIcon } from "../../utils/icons";
import ApiOutlinedMod from "@ant-design/icons-svg/lib/asn/ApiOutlined";
import CheckCircleFilledMod from "@ant-design/icons-svg/lib/asn/CheckCircleFilled";

const ApiOutlinedIcon = (ApiOutlinedMod as any).default ?? ApiOutlinedMod;
const CheckCircleFilledIcon = (CheckCircleFilledMod as any).default ?? CheckCircleFilledMod;

/** Render the model table rows for each preset (no event listeners attached). */
export function renderModelList(
  doc: Document,
  root: HTMLElement,
  presets: ProviderPreset[],
): void {
  const l10n = (doc as any).l10n;
  root.textContent = "";

  for (const preset of presets) {
    const row = ztoolkit.UI.appendElement(
      {
        tag: "div",
        classList: ["pref-model-row", "pref-model-item"],
        attributes: {
          role: "listitem",
          "data-id": preset.id,
          "data-provider": preset.provider,
        },
      },
      root,
    ) as HTMLElement;

    const modelCell = ztoolkit.UI.appendElement(
      {
        tag: "span",
        classList: ["pref-model-cell", "pref-model-cell--model"],
        properties: { textContent: preset.label },
      },
      row,
    ) as HTMLElement;
    try {
      l10n?.setAttributes?.(modelCell as any, preset.labelKey);
    } catch {
      // ignore localization failures
    }

    ztoolkit.UI.appendElement(
      {
        tag: "span",
        classList: ["pref-model-cell", "pref-model-cell--provider"],
        properties: { textContent: getProviderDisplayName(preset.provider) } as any,
      },
      row,
    );

    const apiCell = ztoolkit.UI.appendElement(
      {
        tag: "span",
        classList: ["pref-model-cell", "pref-model-cell--apikey"],
      },
      row,
    ) as HTMLElement;

    ztoolkit.UI.appendElement(
      {
        tag: "input",
        classList: ["pref-model-apikey-input"],
        attributes: { type: "password", "data-provider": preset.provider },
      },
      apiCell,
    );

    const testBtn = ztoolkit.UI.appendElement(
      {
        tag: "button",
        classList: ["zorecto-icon-button", "pref-model-test-btn"],
      },
      apiCell,
    ) as HTMLButtonElement;
    testBtn.type = "button";
    testBtn.appendChild(createAntIcon(doc, ApiOutlinedIcon));
    try {
      l10n?.setAttributes?.(testBtn as any, "zorecto-pref-test");
    } catch {
      // ignore localization failures
    }

    ztoolkit.UI.appendElement(
      {
        tag: "span",
        classList: ["pref-model-status"],
      },
      apiCell,
    );
  }
}

/**
 * Toggle selection state for a given model id in the list.
 * @param root Root element containing all model rows.
 * @param id Selected preset id.
 */
export function setModelSelection(root: HTMLElement, id: string): void {
  const items = Array.from(
    root.querySelectorAll(".pref-model-item"),
  ) as HTMLElement[];
  for (const li of items) {
    li.classList.toggle(
      "pref-model-item--selected",
      li.getAttribute("data-id") === id,
    );
  }
}

/**
 * Clear inline status label for a given model row.
 * @param row Target model row element.
 */
export function clearRowStatus(row: HTMLElement): void {
  const status = row.querySelector<HTMLElement>(".pref-model-status");
  if (!status) return;
  status.textContent = "";
  status.classList.remove("pref-model-status--ok", "pref-model-status--error");
  status.removeAttribute("data-l10n-id");
  status.removeAttribute("data-l10n-args");
  const icons = status.getElementsByClassName("pref-model-status-icon");
  for (const child of Array.from(icons)) {
    (child as HTMLElement).remove();
  }
}

/**
 * Show inline status for a given model row with optional localization.
 * @param doc Host document providing localization helpers.
 * @param row Target model row element.
 * @param options Status display options (kind and localized label).
 */
export function showRowStatus(
  doc: Document,
  row: HTMLElement,
  options: { fallback: string; l10nId?: string; kind: "ok" | "error" },
): void {
  const status = row.querySelector<HTMLElement>(".pref-model-status");
  if (!status) return;
  const l10n = (doc as any).l10n;
  status.classList.toggle("pref-model-status--ok", options.kind === "ok");
  status.classList.toggle("pref-model-status--error", options.kind === "error");
  status.removeAttribute("data-l10n-id");
  status.removeAttribute("data-l10n-args");
  status.textContent = "";
  if (options.kind === "ok") {
    const icon = createAntIcon(doc, CheckCircleFilledIcon);
    icon.classList.add("pref-model-status-icon");
    status.appendChild(icon);
  } else {
    status.textContent = options.fallback;
    if (options.l10nId) {
      try {
        l10n?.setAttributes?.(status, options.l10nId);
      } catch {
        // ignore localization failures
      }
    }
  }
}

/** Map provider id to human readable display name. */
function getProviderDisplayName(provider: ProviderId | string): string {
  switch (provider) {
    case "openai":
      return "OpenAI";
    case "deepseek":
      return "DeepSeek";
    default:
      return provider;
  }
}

