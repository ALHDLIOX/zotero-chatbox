# Interface: HTMLElementProps

Defined in: [src/tools/ui.ts:536](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L536)

## Extends

- `Exclude`\<[`ElementProps`](Interface.ElementProps.md), { `tag`: `any`; }\>

## Properties

### attributes?

ts

```
optional attributes: object;
```

Defined in: [src/tools/ui.ts:475](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L475)

Set with `elem.setAttribute()`

#### Index Signature

ts

```
[key: string]: undefined | null | string | number | boolean
```

#### Inherited from

ts

```
Exclude.attributes;
```

---

### checkExistenceParent?

ts

```
optional checkExistenceParent: HTMLElement;
```

Defined in: [src/tools/ui.ts:507](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L507)

Existence check will be processed under this element, default `document`

#### Inherited from

ts

```
Exclude.checkExistenceParent;
```

---

### children?

ts

```
optional children: TagElementProps[];
```

Defined in: [src/tools/ui.ts:491](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L491)

Child elements. Will be created and appended to this element.

#### Inherited from

ts

```
Exclude.children;
```

---

### classList?

ts

```
optional classList: string[];
```

Defined in: [src/tools/ui.ts:457](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L457)

classList

#### Inherited from

ts

```
Exclude.classList;
```

---

### customCheck()?

ts

```
optional customCheck: (doc, options) => boolean;
```

Defined in: [src/tools/ui.ts:513](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L513)

Custom check hook. If it returns false, return undefined and do not do anything.

#### Parameters

##### doc

`Document`

##### options

[`ElementProps`](Interface.ElementProps.md)

#### Returns

`boolean`

#### Inherited from

ts

```
Exclude.customCheck;
```

---

### ~~directAttributes?~~

ts

```
optional directAttributes: object;
```

Defined in: [src/tools/ui.ts:469](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L469)

#### Index Signature

ts

```
[key: string]: undefined | null | string | number | boolean
```

#### Deprecated

Use `properties`

#### Inherited from

ts

```
Exclude.directAttributes;
```

---

### enableElementDOMLog?

ts

```
optional enableElementDOMLog: boolean;
```

Defined in: [src/tools/ui.ts:529](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L529)

Enable elements to be printed to console & Zotero.debug.

#### Inherited from

ts

```
Exclude.enableElementDOMLog;
```

---

### enableElementJSONLog?

ts

```
optional enableElementJSONLog: boolean;
```

Defined in: [src/tools/ui.ts:525](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L525)

Enable elements to be printed to console & Zotero.debug.

#### Inherited from

ts

```
Exclude.enableElementJSONLog;
```

---

### enableElementRecord?

ts

```
optional enableElementRecord: boolean;
```

Defined in: [src/tools/ui.ts:521](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L521)

Enable elements to be recorded by the toolkit so it can be removed when calling `unregisterAll`.

#### Inherited from

ts

```
Exclude.enableElementRecord;
```

---

### id?

ts

```
optional id: string;
```

Defined in: [src/tools/ui.ts:449](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L449)

id

#### Inherited from

ts

```
Exclude.id;
```

---

### ignoreIfExists?

ts

```
optional ignoreIfExists: boolean;
```

Defined in: [src/tools/ui.ts:495](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L495)

Set true to check if the element exists using `id`. If exists, return this element and do not do anything.

#### Inherited from

ts

```
Exclude.ignoreIfExists;
```

---

### listeners?

ts

```
optional listeners: object[];
```

Defined in: [src/tools/ui.ts:479](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L479)

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

#### Inherited from

ts

```
Exclude.listeners;
```

---

### namespace?

ts

```
optional namespace: "html";
```

Defined in: [src/tools/ui.ts:537](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L537)

xul \| html \| svg

#### Overrides

ts

```
Exclude.namespace;
```

---

### properties?

ts

```
optional properties: object;
```

Defined in: [src/tools/ui.ts:465](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L465)

Set with `elem.prop =`

#### Index Signature

ts

```
[key: string]: unknown
```

#### Inherited from

ts

```
Exclude.properties;
```

---

### removeIfExists?

ts

```
optional removeIfExists: boolean;
```

Defined in: [src/tools/ui.ts:503](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L503)

Set true to check if the element exists using `id`. If exists, remove and re-create it, then continue with props/attrs/children.

#### Inherited from

ts

```
Exclude.removeIfExists;
```

---

### skipIfExists?

ts

```
optional skipIfExists: boolean;
```

Defined in: [src/tools/ui.ts:499](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L499)

Set true to check if the element exists using `id`. If exists, skip element creation and continue with props/attrs/children.

#### Inherited from

ts

```
Exclude.skipIfExists;
```

---

### styles?

ts

```
optional styles: Partial<CSSStyleDeclaration>;
```

Defined in: [src/tools/ui.ts:461](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L461)

styles

#### Inherited from

ts

```
Exclude.styles;
```

---

### ~~subElementOptions?~~

ts

```
optional subElementOptions: TagElementProps[];
```

Defined in: [src/tools/ui.ts:517](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L517)

#### Deprecated

Use `children`

#### Inherited from

ts

```
Exclude.subElementOptions;
```

---

### tag?

ts

```
optional tag: string;
```

Defined in: [src/tools/ui.ts:445](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L445)

tagName

#### Inherited from

ts

```
Exclude.tag;
```
