# Interface: Command

Defined in: [src/managers/prompt.ts:882](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/prompt.ts#L882)

## Properties

### callback

ts

```
callback: Command[] | (prompt) => Promise<void> | (prompt) => void;
```

Defined in: [src/managers/prompt.ts:887](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/prompt.ts#L887)

---

### id?

ts

```
optional id: string;
```

Defined in: [src/managers/prompt.ts:885](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/prompt.ts#L885)

---

### label?

ts

```
optional label: string;
```

Defined in: [src/managers/prompt.ts:884](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/prompt.ts#L884)

---

### name?

ts

```
optional name: string;
```

Defined in: [src/managers/prompt.ts:883](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/prompt.ts#L883)

---

### when()?

ts

```
optional when: () => boolean;
```

Defined in: [src/managers/prompt.ts:886](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/prompt.ts#L886)

#### Returns

`boolean`
