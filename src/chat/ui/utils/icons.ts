/**
 * SVG icon builders for chat UI.
 *
 * Purpose: Create SVG icons via ztoolkit UITool to avoid manual DOM ops.
 * Dependencies: ztoolkit.UI.createElement with `namespace: 'svg'`.
 * Invariants: Return concrete SVG elements; callers may toggle visibility.
 */

/** Create a paper-plane send icon (16x16). */
export function createSendIcon(doc: Document): SVGSVGElement {
  const svg = ztoolkit.UI.createElement(doc, "svg", {
    namespace: "svg",
    attributes: {
      viewBox: "0 0 1024 1024",
      width: "16",
      height: "16",
      "aria-hidden": "true",
      fill: "currentColor",
    },
    styles: { display: "block" },
    children: [
      {
        tag: "path",
        namespace: "svg",
        attributes: {
          d:
            "M931.4 498.9L94.9 79.5c-3.4-1.7-7.3-2.1-11-1.2-8.5 2.1-13.8 10.7-11.7 19.3l86.2 352.2c1.3 5.3 5.2 9.6 10.4 11.3l147.7 50.7-147.6 50.7c-5.2 1.8-9.1 6.1-10.4 11.3L72.2 926.5c-.9 3.7-.5 7.6 1.2 10.9 3.9 7.9 13.5 11.1 21.5 7.2l836.5-417c3.1-1.5 5.6-4.1 7.2-7.1 3.9-8 .7-17.6-7.2-21.6zM170.8 826.3l50.3-205.6 295.2-101.3c2.3-.8 4.2-2.6 5-5 1.4-4.2-.8-8.7-5-10.2L221.1 403.3l-50.3-205.6L845.2 512 170.8 826.3z",
          fill: "currentColor",
        },
      },
    ],
  });
  return svg as unknown as SVGSVGElement;
}

/** Create a stop-square icon (16x16). */
export function createStopIcon(doc: Document): SVGSVGElement {
  const svg = ztoolkit.UI.createElement(doc, "svg", {
    namespace: "svg",
    attributes: {
      viewBox: "0 0 1024 1024",
      width: "16",
      height: "16",
      "aria-hidden": "true",
      fill: "currentColor",
    },
    styles: { display: "block" },
    children: [
      {
        tag: "rect",
        namespace: "svg",
        attributes: {
          x: "256",
          y: "256",
          width: "512",
          height: "512",
          rx: "64",
          fill: "currentColor",
        },
      },
    ],
  });
  return svg as unknown as SVGSVGElement;
}

/** Create a delete/trash icon (16x16). */
export function createDeleteIcon(doc: Document): SVGSVGElement | null {
  try {
    const svg = ztoolkit.UI.createElement(doc, "svg", {
      namespace: "svg",
      attributes: {
        viewBox: "0 0 1024 1024",
        width: "16",
        height: "16",
        "aria-hidden": "true",
        fill: "currentColor",
      },
      styles: { display: "block" },
      children: [
        {
          tag: "path",
          namespace: "svg",
          attributes: {
            d:
              "M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z",
            fill: "currentColor",
          },
        },
      ],
    });
    return svg as unknown as SVGSVGElement;
  } catch {
    return null;
  }
}

/** Create a copy icon (14x14). */
export function createCopyIcon(doc: Document): SVGSVGElement | null {
  try {
    const svg = ztoolkit.UI.createElement(doc, "svg", {
      namespace: "svg",
      attributes: {
        viewBox: "0 0 1024 1024",
        width: "14",
        height: "14",
        "aria-hidden": "true",
        fill: "currentColor",
      },
      styles: { display: "block" },
      children: [
        {
          tag: "path",
          namespace: "svg",
          attributes: {
            d:
              "M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z",
            fill: "currentColor",
          },
        },
      ],
    });
    return svg as unknown as SVGSVGElement;
  } catch {
    return null;
  }
}

/** Create a note/document icon (14x14). */
export function createNoteIcon(doc: Document): SVGSVGElement | null {
  try {
    const svg = ztoolkit.UI.createElement(doc, "svg", {
      namespace: "svg",
      attributes: {
        viewBox: "64 64 896 896",
        width: "14",
        height: "14",
        "aria-hidden": "true",
        fill: "currentColor",
      },
      styles: { display: "block" },
      children: [
        {
          tag: "path",
          namespace: "svg",
          attributes: {
            d:
              "M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0042 42h216v494zM504 618H320c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8zM312 490v48c0 4.4 3.6 8 8 8h384c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H320c-4.4 0-8 3.6-8 8z",
            fill: "currentColor",
          },
        },
      ],
    });
    return svg as unknown as SVGSVGElement;
  } catch {
    return null;
  }
}

/** Create a down-chevron (Ant Design: DownOutlined) icon (12x12). */
export function createDownOutlinedIcon(doc: Document): SVGSVGElement | null {
  try {
    const svg = ztoolkit.UI.createElement(doc, "svg", {
      namespace: "svg",
      // Ant Design: DownOutlined
      attributes: {
        viewBox: "64 64 896 896",
        width: "12",
        height: "12",
        "aria-hidden": "true",
        fill: "currentColor",
      },
      styles: { display: "block" },
      children: [
        {
          tag: "path",
          namespace: "svg",
          attributes: {
            d:
              "M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z",
            fill: "currentColor",
          },
        },
      ],
    });
    return svg as unknown as SVGSVGElement;
  } catch {
    return null;
  }
}
