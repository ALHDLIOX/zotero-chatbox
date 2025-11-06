export interface MessageDom {
  container: HTMLDivElement;
  content: HTMLDivElement;
  roleLabel: HTMLSpanElement;
  mathError: HTMLDivElement;
  actions?: HTMLDivElement;
  copyButton?: HTMLButtonElement;
  noteButton?: HTMLButtonElement;
  latestContent?: string;
}

export interface RenderOptions {
  suppressMathError?: boolean;
}

