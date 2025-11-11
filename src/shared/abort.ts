/**
 * AbortSignal utilities for async cancellation.
 * - Resolves AbortSignal constructor from Zotero toolkit/host window when needed
 * - Provides timeout signal via AbortSignal.timeout (required)
 * - Combines multiple signals with native AbortSignal.any or a small polyfill
 *
 * Dependencies: relies on global `ztoolkit` to resolve globals and for logging.
 * Invariants: when multiple signals are combined, the first to abort wins.
 */

type AbortSignalCtor = typeof AbortSignal;
type AbortControllerCtor = typeof AbortController;

function getToolkitGlobal<T = unknown>(name: string): T | undefined {
  try {
    const getter = (ztoolkit as { getGlobal?: (key: string) => unknown })?.getGlobal;
    if (typeof getter === "function") {
      return getter.call(ztoolkit, name) as T | undefined;
    }
  } catch (error) {
    void error;
  }
  return undefined;
}

function resolveAbortSignalCtor(): AbortSignalCtor | undefined {
  const toolkitSignal = getToolkitGlobal<AbortSignalCtor>("AbortSignal");
  if (toolkitSignal) return toolkitSignal;

  const toolkitWindow = getToolkitGlobal<Window>("window");
  if (toolkitWindow && typeof toolkitWindow.AbortSignal === "function") {
    return toolkitWindow.AbortSignal as AbortSignalCtor;
  }

  const zotero = getToolkitGlobal<{ getMainWindow?: () => Window }>("Zotero");
  const mainWindow = zotero?.getMainWindow?.();
  if (mainWindow && typeof (mainWindow as any).AbortSignal === "function") {
    return (mainWindow as any).AbortSignal as AbortSignalCtor;
  }

  if (typeof AbortSignal !== "undefined") {
    return AbortSignal as AbortSignalCtor;
  }

  const globalSignal =
    typeof globalThis !== "undefined"
      ? ((globalThis as { AbortSignal?: AbortSignalCtor }).AbortSignal ?? undefined)
      : undefined;
  if (globalSignal) return globalSignal;
  return undefined;
}

function resolveAbortControllerCtor(): AbortControllerCtor | undefined {
  const toolkitController = getToolkitGlobal<AbortControllerCtor>("AbortController");
  if (toolkitController) return toolkitController;

  const toolkitWindow = getToolkitGlobal<Window>("window");
  if (toolkitWindow && typeof toolkitWindow.AbortController === "function") {
    return toolkitWindow.AbortController as AbortControllerCtor;
  }

  const zotero = getToolkitGlobal<{ getMainWindow?: () => Window }>("Zotero");
  const mainWindow = zotero?.getMainWindow?.();
  if (mainWindow && typeof (mainWindow as any).AbortController === "function") {
    return (mainWindow as any).AbortController as AbortControllerCtor;
  }

  if (typeof AbortController !== "undefined") {
    return AbortController as AbortControllerCtor;
  }

  const globalController =
    typeof globalThis !== "undefined"
      ? ((globalThis as { AbortController?: AbortControllerCtor }).AbortController ?? undefined)
      : undefined;
  if (globalController) return globalController;
  return undefined;
}

interface AbortSupport {
  signalCtor: AbortSignalCtor;
  signalAny?: (iterable: Iterable<AbortSignal>) => AbortSignal;
  signalTimeout: (milliseconds: number) => AbortSignal;
}

let cachedAbortSupport: AbortSupport | undefined;

function requireAbortSupport(): AbortSupport {
  if (cachedAbortSupport) return cachedAbortSupport;

  const signalCtor = resolveAbortSignalCtor();
  if (!signalCtor) {
    throw new Error("AbortSignal is required for abort utilities.");
  }

  const signalTimeout = (signalCtor as unknown as { timeout?: (ms: number) => AbortSignal }).timeout;
  if (typeof signalTimeout !== "function") {
    throw new Error("AbortSignal.timeout is required for abort utilities.");
  }

  cachedAbortSupport = {
    signalCtor,
    signalAny: (signalCtor as unknown as { any?: (it: Iterable<AbortSignal>) => AbortSignal }).any,
    signalTimeout,
  };
  return cachedAbortSupport;
}

/**
 * Returns a timeout AbortSignal or undefined when ms <= 0.
 * Throws if AbortSignal.timeout is unavailable (by design, per choice 2A).
 */
export function startTimeout(ms: number): AbortSignal | undefined {
  if (ms <= 0) return undefined;
  const { signalTimeout } = requireAbortSupport();
  return signalTimeout(ms);
}

/** Extract the generic reason from an AbortSignal (if present). */
export function getAbortReason(signal?: AbortSignal): unknown {
  if (!signal) return undefined;
  const reason = (signal as { reason?: unknown }).reason;
  return typeof reason === "undefined" ? undefined : reason;
}

/**
 * Create an AbortController from the host environment.
 * - Resolves AbortController ctor via Zotero toolkit / main window / globalThis
 * - Returns undefined if construction fails (caller may degrade behavior)
 */
export function createAbortController(): AbortController | undefined {
  try {
    const ctor = resolveAbortControllerCtor();
    if (!ctor) return undefined;
    return new ctor();
  } catch (error) {
    void error;
    return undefined;
  }
}

/** Deduplicate and return a list of AbortSignals. */
export function collectSignals(...signals: Array<AbortSignal | undefined>): AbortSignal[] {
  const seen = new Set<AbortSignal>();
  for (const signal of signals) {
    if (signal && !seen.has(signal)) seen.add(signal);
  }
  return Array.from(seen);
}

/**
 * Combine multiple AbortSignals into one.
 * - Uses AbortSignal.any when available
 * - Otherwise falls back to a polyfill that aborts when any input aborts
 */
export function combineSignals(signals: Array<AbortSignal | undefined>): AbortSignal | undefined {
  const filtered = signals.filter((s): s is AbortSignal => Boolean(s));
  if (filtered.length === 0) return undefined;
  if (filtered.length === 1) return filtered[0];

  const { signalAny, signalCtor } = requireAbortSupport();
  if (signalAny && typeof signalAny === "function") {
    try {
      return signalAny.call(signalCtor, filtered);
    } catch (error) {
      ztoolkit.log("[zorecto] AbortSignal.any failed, using polyfill", { error });
    }
  }

  // Polyfill: create a controller that aborts when any input aborts
  const controller = createAbortController();
  if (!controller) {
    try {
      ztoolkit.log("[zorecto] Abort polyfill: no AbortController in this compartment; degrading to first input signal", {
        count: filtered.length,
      });
    } catch {}
    // Degrade: return the first signal so at least one cancellation source works
    return filtered[0];
  }
  const outSignal = controller.signal;

  const dispose: Array<() => void> = [];
  const abortOnce = (reason?: unknown) => {
    if (!(outSignal as any).aborted) {
      try {
        (controller as any).abort(reason);
      } catch {
        // older implementations may not accept reason
        try { (controller as any).abort(); } catch {}
      }
      for (const d of dispose) {
        try { d(); } catch {}
      }
    }
  };

  // Immediate: if any is already aborted
  for (const s of filtered) {
    if (s.aborted) {
      abortOnce(getAbortReason(s));
      return outSignal;
    }
  }

  for (const s of filtered) {
    const handler = () => abortOnce(getAbortReason(s));
    s.addEventListener("abort", handler, { once: true });
    dispose.push(() => {
      try { s.removeEventListener("abort", handler); } catch {}
    });
  }

  ztoolkit.log("[zorecto] Using AbortSignal polyfill combine", { count: filtered.length });
  return outSignal;
}
