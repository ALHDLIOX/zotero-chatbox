/** Action buttons (Send/Stop, Clear) with mode control and icons. */
import { createSendIcon, createStopIcon, createDeleteIcon } from "../utils/icons";

export interface ActionButtons {
  row: HTMLDivElement;
  sendButton: HTMLButtonElement;
  clearButton: HTMLButtonElement;
  setMode(mode: "send" | "stop"): void;
}

export function buildActionButtons(
  doc: Document,
  handlers: {
    onSend: (ev: Event) => void | Promise<void>;
    onStop: (ev: Event) => void | Promise<void>;
    onClear: (ev: Event) => void | Promise<void>;
  },
): ActionButtons {
  const row = doc.createElement("div");
  row.className = "zorecto-button-row";

  const sendButton = doc.createElement("button") as HTMLButtonElement;
  sendButton.className = "zorecto-send-button";
  sendButton.type = "button";
  sendButton.title = "Send";

  const clearButton = doc.createElement("button") as HTMLButtonElement;
  clearButton.className = "zorecto-clear-button";
  clearButton.type = "button";
  clearButton.title = "Clear";

  // icons
  let sendIcon = createSendIcon(doc);
  let stopIcon = createStopIcon(doc);
  (stopIcon.style as any).display = "none";
  try {
    sendButton.appendChild(sendIcon);
    sendButton.appendChild(stopIcon);
  } catch {
    sendButton.textContent = "✈";
  }
  // delete icon
  {
    const del = createDeleteIcon(doc);
    if (del) clearButton.replaceChildren(del);
    else clearButton.textContent = "🗑";
  }

  // mode toggle
  let mode: "send" | "stop" = "send";
  function setMode(next: "send" | "stop") {
    mode = next;
    sendButton.dataset.mode = next;
    sendButton.title = next === "send" ? "Send" : "Stop";
    try {
      (sendIcon.style as any).display = next === "send" ? "" : "none";
      (stopIcon.style as any).display = next === "stop" ? "" : "none";
    } catch {}
    sendButton.classList.toggle("zorecto-send-button--stop", next === "stop");
  }

  sendButton.addEventListener("click", (ev: Event) => {
    if (mode === "send") {
      void handlers.onSend(ev);
    } else {
      void handlers.onStop(ev);
    }
  });

  clearButton.addEventListener("click", (ev: Event) => void handlers.onClear(ev));

  row.appendChild(clearButton);
  row.appendChild(sendButton);

  return { row: row as HTMLDivElement, sendButton, clearButton, setMode };
}
