/** Action buttons (Send/Stop, Clear) with mode control and icons. */
import { createSendIcon, createStopIcon } from "../utils/icons";

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
  // delete icon (simple)
  try {
    const del = doc.createElementNS("http://www.w3.org/2000/svg", "svg") as any;
    del.setAttribute("viewBox", "0 0 1024 1024");
    del.setAttribute("width", "16");
    del.setAttribute("height", "16");
    del.setAttribute("aria-hidden", "true");
    del.setAttribute("fill", "currentColor");
    del.style.display = "block";
    const path = doc.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z");
    path.setAttribute("fill", "currentColor");
    del.appendChild(path);
    clearButton.replaceChildren(del);
  } catch {
    clearButton.textContent = "🗑";
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

