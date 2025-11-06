import { getString } from "../../../../shared/locale";
import type { SessionMessage } from "../../../state/sessionStore";
import type { MessageDom } from "../types";
import { createCopyIcon, createNoteIcon } from "../../utils/icons";

export function createMessageDom(
  doc: Document,
  message: SessionMessage,
  onCopy: (messageId: string) => void,
  onNote?: (messageId: string) => void,
): MessageDom {
  const container = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-message"],
    attributes: { "data-message-id": message.id },
  });

  const roleLabel = ztoolkit.UI.createElement(doc, "span", {
    classList: ["zorecto-message-role"],
    properties: { hidden: true },
  });

  const content = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-message-content"],
  });

  const mathError = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-message-math-error"],
    properties: { hidden: true },
  });

  let actions: HTMLDivElement | undefined;
  let copyButton!: HTMLButtonElement;
  let noteButton!: HTMLButtonElement;

  if (message.role === "assistant") {
    actions = ztoolkit.UI.createElement(doc, "div", {
      classList: ["zorecto-message-actions"],
      properties: { hidden: true },
    });

    copyButton = ztoolkit.UI.createElement(doc, "button", {
      classList: ["zorecto-copy-button"],
      properties: {
        type: "button",
        title: getString("zorecto-copy-button"),
      } as any,
      listeners: [
        {
          type: "click",
          listener: () => onCopy(message.id),
        },
      ],
    });
    {
      const icon = createCopyIcon(doc);
      if (icon) copyButton!.appendChild(icon);
      else copyButton!.textContent = getString("zorecto-copy-button");
    }
    if (actions && copyButton) actions.appendChild(copyButton);

    noteButton = ztoolkit.UI.createElement(doc, "button", {
      classList: ["zorecto-note-button"],
      properties: {
        type: "button",
        title: getString("zorecto-note-button"),
      } as any,
      listeners: [
        {
          type: "click",
          listener: () => onNote && onNote(message.id),
        },
      ],
    });
    {
      const icon = createNoteIcon(doc);
      if (icon) noteButton!.appendChild(icon);
      else noteButton!.textContent = getString("zorecto-note-button");
    }
    if (actions && noteButton) actions.appendChild(noteButton);
  }

  // Role label is intentionally not appended to container.
  container.appendChild(content);
  container.appendChild(mathError);
  if (actions) container.appendChild(actions);

  return {
    container,
    content,
    roleLabel,
    mathError,
    actions,
    copyButton,
    noteButton,
  };
}
