# Interface: ElementProps

Defined in: [src/tools/ui.ts:441](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L441)

`props` of `UITool.createElement`. See [UITool](Class.UITool.md)

## Extended by

- [`TagElementProps`](Interface.TagElementProps.md)

## Properties

### attributes?

ts

```
optional attributes: object;
```

Defined in: [src/tools/ui.ts:475](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L475)

Set with `elem.setAttribute()`

#### Index Signature

ts

```
[key: string]: undefined | null | string | number | boolean
```

---

### checkExistenceParent?

ts

```
optional checkExistenceParent: HTMLElement;
```

Defined in: [src/tools/ui.ts:507](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L507)

Existence check will be processed under this element, default `document`

---

### children?

ts

```
optional children: TagElementProps[];
```

Defined in: [src/tools/ui.ts:491](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L491)

Child elements. Will be created and appended to this element.

---

### classList?

ts

```
optional classList: string[];
```

Defined in: [src/tools/ui.ts:457](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L457)

classList

---

### customCheck()?

ts

```
optional customCheck: (doc, options) => boolean;
```

Defined in: [src/tools/ui.ts:513](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L513)

Custom check hook. If it returns false, return undefined and do not do anything.

#### Parameters

##### doc

`Document`

##### options

`ElementProps`

#### Returns

`boolean`

---

### ~~directAttributes?~~

ts

```
optional directAttributes: object;
```

Defined in: [src/tools/ui.ts:469](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L469)

#### Index Signature

ts

```
[key: string]: undefined | null | string | number | boolean
```

#### Deprecated

Use `properties`

---

### enableElementDOMLog?

ts

```
optional enableElementDOMLog: boolean;
```

Defined in: [src/tools/ui.ts:529](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L529)

Enable elements to be printed to console & Zotero.debug.

---

### enableElementJSONLog?

ts

```
optional enableElementJSONLog: boolean;
```

Defined in: [src/tools/ui.ts:525](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L525)

Enable elements to be printed to console & Zotero.debug.

---

### enableElementRecord?

ts

```
optional enableElementRecord: boolean;
```

Defined in: [src/tools/ui.ts:521](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L521)

Enable elements to be recorded by the toolkit so it can be removed when calling `unregisterAll`.

---

### id?

ts

```
optional id: string;
```

Defined in: [src/tools/ui.ts:449](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L449)

id

---

### ignoreIfExists?

ts

```
optional ignoreIfExists: boolean;
```

Defined in: [src/tools/ui.ts:495](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L495)

Set true to check if the element exists using `id`. If exists, return this element and do not do anything.

---

### listeners?

ts

```
optional listeners: object[];
```

Defined in: [src/tools/ui.ts:479](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L479)

Event listeners

#### listener

ts

```
listener: undefined | null | EventListenerOrEventListenerObject | (e) => void;
```

#### options?

ts

```
optional options: boolean | AddEventListenerOptions;
```

#### type

ts

```
type: string;
```

---

### namespace?

ts

```
optional namespace: string;
```

Defined in: [src/tools/ui.ts:453](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L453)

xul \| html \| svg

---

### properties?

ts

```
optional properties: object;
```

Defined in: [src/tools/ui.ts:465](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L465)

Set with `elem.prop =`

#### Index Signature

ts

```
[key: string]: unknown
```

---

### removeIfExists?

ts

```
optional removeIfExists: boolean;
```

Defined in: [src/tools/ui.ts:503](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L503)

Set true to check if the element exists using `id`. If exists, remove and re-create it, then continue with props/attrs/children.

---

### skipIfExists?

ts

```
optional skipIfExists: boolean;
```

Defined in: [src/tools/ui.ts:499](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L499)

Set true to check if the element exists using `id`. If exists, skip element creation and continue with props/attrs/children.

---

### styles?

ts

```
optional styles: Partial<CSSStyleDeclaration>;
```

Defined in: [src/tools/ui.ts:461](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L461)

styles

---

### ~~subElementOptions?~~

ts

```
optional subElementOptions: TagElementProps[];
```

Defined in: [src/tools/ui.ts:517](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L517)

#### Deprecated

Use `children`

---

### tag?

ts

```
optional tag: string;
```

Defined in: [src/tools/ui.ts:445](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/tools/ui.ts#L445)

tagName
