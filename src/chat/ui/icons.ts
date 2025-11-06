/** SVG icon builders for chat UI. */

export function createSendIcon(doc: Document): SVGSVGElement {
  const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg") as unknown as SVGSVGElement;
  svg.setAttribute("viewBox", "0 0 1024 1024");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("fill", "currentColor");
  (svg as any).style.display = "block";
  const p = doc.createElementNS("http://www.w3.org/2000/svg", "path");
  p.setAttribute(
    "d",
    "M931.4 498.9L94.9 79.5c-3.4-1.7-7.3-2.1-11-1.2-8.5 2.1-13.8 10.7-11.7 19.3l86.2 352.2c1.3 5.3 5.2 9.6 10.4 11.3l147.7 50.7-147.6 50.7c-5.2 1.8-9.1 6.1-10.4 11.3L72.2 926.5c-.9 3.7-.5 7.6 1.2 10.9 3.9 7.9 13.5 11.1 21.5 7.2l836.5-417c3.1-1.5 5.6-4.1 7.2-7.1 3.9-8 .7-17.6-7.2-21.6zM170.8 826.3l50.3-205.6 295.2-101.3c2.3-.8 4.2-2.6 5-5 1.4-4.2-.8-8.7-5-10.2L221.1 403.3l-50.3-205.6L845.2 512 170.8 826.3z",
  );
  p.setAttribute("fill", "currentColor");
  svg.appendChild(p);
  return svg;
}

export function createStopIcon(doc: Document): SVGSVGElement {
  const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg") as unknown as SVGSVGElement;
  svg.setAttribute("viewBox", "0 0 1024 1024");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("fill", "currentColor");
  (svg as any).style.display = "block";
  const rect = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", "256");
  rect.setAttribute("y", "256");
  rect.setAttribute("width", "512");
  rect.setAttribute("height", "512");
  rect.setAttribute("rx", "64");
  rect.setAttribute("fill", "currentColor");
  svg.appendChild(rect);
  return svg;
}

