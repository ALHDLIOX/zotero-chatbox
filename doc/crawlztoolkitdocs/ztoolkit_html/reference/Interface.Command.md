# Interface: Command

Defined in: [src/managers/prompt.ts:882](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/managers/prompt.ts#L882)

## Properties

### callback

ts

```
callback: Command[] | (prompt) => Promise<void> | (prompt) => void;
```

Defined in: [src/managers/prompt.ts:887](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/managers/prompt.ts#L887)

---

### id?

ts

```
optional id: string;
```

Defined in: [src/managers/prompt.ts:885](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/managers/prompt.ts#L885)

---

### label?

ts

```
optional label: string;
```

Defined in: [src/managers/prompt.ts:884](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/managers/prompt.ts#L884)

---

### name?

ts

```
optional name: string;
```

Defined in: [src/managers/prompt.ts:883](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/managers/prompt.ts#L883)

---

### when()?

ts

```
optional when: () => boolean;
```

Defined in: [src/managers/prompt.ts:886](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/managers/prompt.ts#L886)

#### Returns

`boolean`
