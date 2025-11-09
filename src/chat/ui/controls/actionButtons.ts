/** Action buttons (Send/Stop, Clear) with mode control and icons. */
import { createSendIcon, createStopIcon, createDeleteIcon } from "../utils/icons";

/** Handles to the input action buttons row. */
export interface ActionButtons {
  row: HTMLDivElement;
  sendButton: HTMLButtonElement;
  clearButton: HTMLButtonElement;
  setMode(mode: "send" | "stop"): void;
}

/**
 * Build the action buttons row with send/stop and clear controls.
 * @param doc - Pane document used for DOM operations
 * @param handlers - Event callbacks for the buttons
 */
export function buildActionButtons(
  doc: Document,
  handlers: {
    onSend: (ev: Event) => void | Promise<void>;
    onStop: (ev: Event) => void | Promise<void>;
    onClear: (ev: Event) => void | Promise<void>;
  },
): ActionButtons {
  const row = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-button-row"],
    enableElementRecord: true,
  }) as HTMLDivElement;

  let mode: "send" | "stop" = "send";

  const buildModeButton = (m: "send" | "stop"): HTMLButtonElement => {
    const isSend = m === "send";
    const btn = ztoolkit.UI.createElement(doc, "button", {
      namespace: "html",
      classList: [
        "zorecto-send-button",
        ...(isSend ? [] : ["zorecto-send-button--stop"]),
      ],
      properties: { type: "button", title: isSend ? "Send" : "Stop" },
      attributes: { "data-mode": m },
      listeners: [
        {
          type: "click",
          listener: (ev: Event) => {
            if (m === "send") void handlers.onSend(ev);
            else void handlers.onStop(ev);
          },
        },
      ],
    }) as HTMLButtonElement;
    const icon = isSend ? createSendIcon(doc) : createStopIcon(doc);
    if (icon) btn.replaceChildren(icon);
    else btn.textContent = isSend ? "✈" : "■";
    return btn;
  };

  let sendButton = buildModeButton(mode);

  const clearButton = ztoolkit.UI.createElement(doc, "button", {
    namespace: "html",
    classList: ["zorecto-clear-button"],
    properties: { type: "button" },
    attributes: { title: "Clear" },
    listeners: [
      {
        type: "click",
        listener: (ev: Event) => void handlers.onClear(ev),
      },
    ],
  }) as HTMLButtonElement;

  const deleteIcon = createDeleteIcon(doc);
  if (deleteIcon) clearButton.replaceChildren(deleteIcon);
  else clearButton.textContent = "🗑";

  function setMode(next: "send" | "stop") {
    if (next === mode) return;
    const newBtn = buildModeButton(next);
    try {
      sendButton.replaceWith(newBtn);
    } catch {}
    sendButton = newBtn;
    mode = next;
  }

  row.append(clearButton, sendButton);
  setMode("send");

  return { row, sendButton, clearButton, setMode };
}
