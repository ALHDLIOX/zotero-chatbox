/** Build welcome placeholder block with suggestion cards. */
import { getString } from "../../shared/locale";

export function buildWelcomeBlock(
  doc: Document,
  onAsk: (question: string) => void,
): HTMLElement {
  const wrap = doc.createElement("div");
  wrap.className = "zorecto-welcome";
  const title = doc.createElement("div");
  title.className = "zorecto-welcome-title";
  title.textContent = getString("zorecto-welcome-title");
  const sub = doc.createElement("div");
  sub.className = "zorecto-welcome-subtitle";
  sub.textContent = getString("zorecto-welcome-subtitle");
  const list = doc.createElement("div");
  list.className = "zorecto-suggestions";
  const promptIds = ["zorecto-suggest-1", "zorecto-suggest-2", "zorecto-suggest-3"] as const;
  for (const id of promptIds) {
    const label = getString(id as any);
    const btn = doc.createElement("button") as HTMLButtonElement;
    btn.className = "zorecto-suggestion";
    btn.type = "button";
    btn.textContent = label;
    btn.addEventListener("click", () => onAsk(label));
    list.appendChild(btn);
  }
  wrap.appendChild(title);
  wrap.appendChild(sub);
  wrap.appendChild(list);
  return wrap;
}

