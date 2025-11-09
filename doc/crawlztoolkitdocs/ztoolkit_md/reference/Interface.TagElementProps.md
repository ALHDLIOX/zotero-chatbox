# Interface: TagElementProps

Defined in: [src/tools/ui.ts:532](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L532)

`props` of `UITool.createElement`. See [UITool](Class.UITool.md)

## Extends

- [`ElementProps`](Interface.ElementProps.md)

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

[`ElementProps`](Interface.ElementProps.md).[`attributes`](./Interface.ElementProps.md#attributes)

---

### checkExistenceParent?

ts

```
optional checkExistenceParent: HTMLElement;
```

Defined in: [src/tools/ui.ts:507](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L507)

Existence check will be processed under this element, default `document`

#### Inherited from

[`ElementProps`](Interface.ElementProps.md).[`checkExistenceParent`](./Interface.ElementProps.md#checkexistenceparent)

---

### children?

ts

```
optional children: TagElementProps[];
```

Defined in: [src/tools/ui.ts:491](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L491)

Child elements. Will be created and appended to this element.

#### Inherited from

[`ElementProps`](Interface.ElementProps.md).[`children`](./Interface.ElementProps.md#children)

---

### classList?

ts

```
optional classList: string[];
```

Defined in: [src/tools/ui.ts:457](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L457)

classList

#### Inherited from

[`ElementProps`](Interface.ElementProps.md).[`classList`](./Interface.ElementProps.md#classlist)

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

[`ElementProps`](Interface.ElementProps.md).[`customCheck`](./Interface.ElementProps.md#customcheck)

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

[`ElementProps`](Interface.ElementProps.md).[`directAttributes`](./Interface.ElementProps.md#directattributes)

---

### enableElementDOMLog?

ts

```
optional enableElementDOMLog: boolean;
```

Defined in: [src/tools/ui.ts:529](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L529)

Enable elements to be printed to console & Zotero.debug.

#### Inherited from

[`ElementProps`](Interface.ElementProps.md).[`enableElementDOMLog`](./Interface.ElementProps.md#enableelementdomlog)

---

### enableElementJSONLog?

ts

```
optional enableElementJSONLog: boolean;
```

Defined in: [src/tools/ui.ts:525](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L525)

Enable elements to be printed to console & Zotero.debug.

#### Inherited from

[`ElementProps`](Interface.ElementProps.md).[`enableElementJSONLog`](./Interface.ElementProps.md#enableelementjsonlog)

---

### enableElementRecord?

ts

```
optional enableElementRecord: boolean;
```

Defined in: [src/tools/ui.ts:521](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L521)

Enable elements to be recorded by the toolkit so it can be removed when calling `unregisterAll`.

#### Inherited from

[`ElementProps`](Interface.ElementProps.md).[`enableElementRecord`](./Interface.ElementProps.md#enableelementrecord)

---

### id?

ts

```
optional id: string;
```

Defined in: [src/tools/ui.ts:449](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L449)

id

#### Inherited from

[`ElementProps`](Interface.ElementProps.md).[`id`](./Interface.ElementProps.md#id)

---

### ignoreIfExists?

ts

```
optional ignoreIfExists: boolean;
```

Defined in: [src/tools/ui.ts:495](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L495)

Set true to check if the element exists using `id`. If exists, return this element and do not do anything.

#### Inherited from

[`ElementProps`](Interface.ElementProps.md).[`ignoreIfExists`](./Interface.ElementProps.md#ignoreifexists)

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

[`ElementProps`](Interface.ElementProps.md).[`listeners`](./Interface.ElementProps.md#listeners)

---

### namespace?

ts

```
optional namespace: string;
```

Defined in: [src/tools/ui.ts:453](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L453)

xul \| html \| svg

#### Inherited from

[`ElementProps`](Interface.ElementProps.md).[`namespace`](./Interface.ElementProps.md#namespace)

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

[`ElementProps`](Interface.ElementProps.md).[`properties`](./Interface.ElementProps.md#properties)

---

### removeIfExists?

ts

```
optional removeIfExists: boolean;
```

Defined in: [src/tools/ui.ts:503](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L503)

Set true to check if the element exists using `id`. If exists, remove and re-create it, then continue with props/attrs/children.

#### Inherited from

[`ElementProps`](Interface.ElementProps.md).[`removeIfExists`](./Interface.ElementProps.md#removeifexists)

---

### skipIfExists?

ts

```
optional skipIfExists: boolean;
```

Defined in: [src/tools/ui.ts:499](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L499)

Set true to check if the element exists using `id`. If exists, skip element creation and continue with props/attrs/children.

#### Inherited from

[`ElementProps`](Interface.ElementProps.md).[`skipIfExists`](./Interface.ElementProps.md#skipifexists)

---

### styles?

ts

```
optional styles: Partial<CSSStyleDeclaration>;
```

Defined in: [src/tools/ui.ts:461](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L461)

styles

#### Inherited from

[`ElementProps`](Interface.ElementProps.md).[`styles`](./Interface.ElementProps.md#styles)

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

[`ElementProps`](Interface.ElementProps.md).[`subElementOptions`](./Interface.ElementProps.md#subelementoptions)

---

### tag

ts

```
tag: string;
```

Defined in: [src/tools/ui.ts:533](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L533)

tagName

#### Overrides

[`ElementProps`](Interface.ElementProps.md).[`tag`](./Interface.ElementProps.md#tag)
