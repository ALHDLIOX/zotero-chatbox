# Interface: DialogData

Defined in: [src/helpers/dialog.ts:723](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/dialog.ts#L723)

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

Defined in: [src/helpers/dialog.ts:736](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/dialog.ts#L736)

#### Returns

`void`

---

### l10nFiles?

ts

```
optional l10nFiles: string | string[];
```

Defined in: [src/helpers/dialog.ts:737](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/dialog.ts#L737)

---

### loadCallback()?

ts

```
optional loadCallback: () => void;
```

Defined in: [src/helpers/dialog.ts:730](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/dialog.ts#L730)

#### Returns

`void`

---

### loadLock?

ts

```
optional loadLock: object;
```

Defined in: [src/helpers/dialog.ts:725](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/dialog.ts#L725)

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

Defined in: [src/helpers/dialog.ts:735](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/dialog.ts#L735)

#### Returns

`void`

---

### unloadLock?

ts

```
optional unloadLock: object;
```

Defined in: [src/helpers/dialog.ts:731](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/dialog.ts#L731)

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
