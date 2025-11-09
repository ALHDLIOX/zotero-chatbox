# Interface: DialogData

Defined in: [src/helpers/dialog.ts:723](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/helpers/dialog.ts#L723)

## Indexable

ts

```
[key: string | number | symbol]: any
```

## Properties

### beforeUnloadCallback()?

ts

```
optional beforeUnloadCallback: () => void;
```

Defined in: [src/helpers/dialog.ts:736](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/helpers/dialog.ts#L736)

#### Returns

`void`

---

### l10nFiles?

ts

```
optional l10nFiles: string | string[];
```

Defined in: [src/helpers/dialog.ts:737](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/helpers/dialog.ts#L737)

---

### loadCallback()?

ts

```
optional loadCallback: () => void;
```

Defined in: [src/helpers/dialog.ts:730](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/helpers/dialog.ts#L730)

#### Returns

`void`

---

### loadLock?

ts

```
optional loadLock: object;
```

Defined in: [src/helpers/dialog.ts:725](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/helpers/dialog.ts#L725)

#### isResolved()

ts

```
isResolved: () => boolean;
```

##### Returns

`boolean`

#### promise

ts

```
promise: Promise<void>;
```

#### resolve()

ts

```
resolve: () => void;
```

##### Returns

`void`

---

### unloadCallback()?

ts

```
optional unloadCallback: () => void;
```

Defined in: [src/helpers/dialog.ts:735](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/helpers/dialog.ts#L735)

#### Returns

`void`

---

### unloadLock?

ts

```
optional unloadLock: object;
```

Defined in: [src/helpers/dialog.ts:731](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/helpers/dialog.ts#L731)

#### promise

ts

```
promise: Promise<void>;
```

#### resolve()

ts

```
resolve: () => void;
```

##### Returns

`void`
