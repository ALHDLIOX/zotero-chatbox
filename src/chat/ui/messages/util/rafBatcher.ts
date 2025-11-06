export class RafBatcher<T> {
  private readonly doc: Document;
  private readonly onFlush: (items: T[]) => void;
  private readonly queueMap = new Map<string, T>();
  private handle?: number;

  constructor(doc: Document, onFlush: (items: T[]) => void) {
    this.doc = doc;
    this.onFlush = onFlush;
  }

  queue(key: string, payload: T): void {
    this.queueMap.set(key, payload);
  }

  schedule(): void {
    if (this.handle !== undefined) return;
    const win = this.doc.defaultView;
    if (win && typeof win.requestAnimationFrame === "function") {
      this.handle = win.requestAnimationFrame(() => {
        this.handle = undefined;
        this.flush();
      });
    } else {
      this.flush();
    }
  }

  flush(): void {
    const items = Array.from(this.queueMap.values());
    this.queueMap.clear();
    if (items.length > 0) this.onFlush(items);
  }

  clear(): void {
    const win = this.doc.defaultView;
    if (this.handle !== undefined && win && typeof win.cancelAnimationFrame === "function") {
      win.cancelAnimationFrame(this.handle);
    }
    this.handle = undefined;
    this.queueMap.clear();
  }
}

