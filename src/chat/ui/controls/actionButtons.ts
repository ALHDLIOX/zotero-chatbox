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

  const sendButton = ztoolkit.UI.createElement(doc, "button", {
    classList: ["zorecto-send-button"],
    properties: { type: "button" },
    attributes: { title: "Send" },
    listeners: [
      {
        type: "click",
        listener: (ev: Event) => {
          if (mode === "send") void handlers.onSend(ev);
          else void handlers.onStop(ev);
        },
      },
    ],
  }) as HTMLButtonElement;

  const clearButton = ztoolkit.UI.createElement(doc, "button", {
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

  const sendIcon = createSendIcon(doc);
  const stopIcon = createStopIcon(doc);
  if (sendIcon && stopIcon) {
    (stopIcon.style as any).display = "none";
    sendButton.append(sendIcon, stopIcon);
  } else {
    sendButton.textContent = "✈";
  }

  const deleteIcon = createDeleteIcon(doc);
  if (deleteIcon) clearButton.replaceChildren(deleteIcon);
  else clearButton.textContent = "🗑";

  function setMode(next: "send" | "stop") {
    mode = next;
    sendButton.dataset.mode = next;
    sendButton.title = next === "send" ? "Send" : "Stop";
    if (sendIcon) (sendIcon.style as any).display = next === "send" ? "" : "none";
    if (stopIcon) (stopIcon.style as any).display = next === "stop" ? "" : "none";
    sendButton.classList.toggle("zorecto-send-button--stop", next === "stop");
  }

  row.append(clearButton, sendButton);
  setMode("send");

  return { row, sendButton, clearButton, setMode };
}
