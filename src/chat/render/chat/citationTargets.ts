/**
 * WeakMap registry for citation badge → navigation target.
 * Kept in render/chat layer so UI controllers can resolve targets without
 * duplicating parsing or DOM scanning.
 */
import type { CitationTarget } from "../../render/shared/parsing/cite";

const registry = new WeakMap<HTMLElement, CitationTarget>();

export function setCitationTarget(el: HTMLElement, target: CitationTarget): void {
  registry.set(el, target);
}

export function getCitationTarget(el: HTMLElement): CitationTarget | undefined {
  return registry.get(el);
}
