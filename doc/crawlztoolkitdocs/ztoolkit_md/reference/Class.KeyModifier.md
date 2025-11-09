# Class: KeyModifier

Defined in: [src/managers/keyboard.ts:165](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/keyboard.ts#L165)

Class to represent key with modifiers

## Implements

- `KeyModifierStatus`

## Constructors

### Constructor

ts

```
new KeyModifier(raw?, options?): KeyModifier;
```

Defined in: [src/managers/keyboard.ts:175](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/keyboard.ts#L175)

#### Parameters

##### raw?

`string` \| `KeyboardEvent` \| `KeyModifier`

##### options?

###### useAccel?

`boolean`

#### Returns

`KeyModifier`

## Properties

### accel

ts

```
accel: boolean = false;
```

Defined in: [src/managers/keyboard.ts:166](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/keyboard.ts#L166)

#### Implementation of

ts

```
KeyModifierStatus.accel;
```

---

### alt

ts

```
alt: boolean = false;
```

Defined in: [src/managers/keyboard.ts:170](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/keyboard.ts#L170)

#### Implementation of

ts

```
KeyModifierStatus.alt;
```

---

### control

ts

```
control: boolean = false;
```

Defined in: [src/managers/keyboard.ts:168](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/keyboard.ts#L168)

#### Implementation of

ts

```
KeyModifierStatus.control;
```

---

### key

ts

```
key: string = "";
```

Defined in: [src/managers/keyboard.ts:171](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/keyboard.ts#L171)

#### Implementation of

ts

```
KeyModifierStatus.key;
```

---

### meta

ts

```
meta: boolean = false;
```

Defined in: [src/managers/keyboard.ts:169](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/keyboard.ts#L169)

#### Implementation of

ts

```
KeyModifierStatus.meta;
```

---

### shift

ts

```
shift: boolean = false;
```

Defined in: [src/managers/keyboard.ts:167](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/keyboard.ts#L167)

#### Implementation of

ts

```
KeyModifierStatus.shift;
```

---

### useAccel

ts

```
useAccel: boolean = false;
```

Defined in: [src/managers/keyboard.ts:173](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/keyboard.ts#L173)

## Methods

### equals()

ts

```
equals(newMod): boolean;
```

Defined in: [src/managers/keyboard.ts:241](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/keyboard.ts#L241)

Check if the current KeyModifier equals to another KeyModifier.

#### Parameters

##### newMod

the new KeyModifier

`string` \| `KeyModifier`

#### Returns

`boolean`

true if equals

---

### getLocalized()

ts

```
getLocalized(): string;
```

Defined in: [src/managers/keyboard.ts:295](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/keyboard.ts#L295)

Get the localized string representation of the KeyModifier.

#### Returns

`string`

---

### getRaw()

ts

```
getRaw(): string;
```

Defined in: [src/managers/keyboard.ts:281](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/keyboard.ts#L281)

Get the raw string representation of the KeyModifier.

#### Returns

`string`

---

### merge()

ts

```
merge(newMod, options?): KeyModifier;
```

Defined in: [src/managers/keyboard.ts:225](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/managers/keyboard.ts#L225)

Merge another KeyModifier into this one.

#### Parameters

##### newMod

`KeyModifier`

the new KeyModifier

##### options?

###### allowOverwrite?

`boolean`

#### Returns

`KeyModifier`

KeyModifier
