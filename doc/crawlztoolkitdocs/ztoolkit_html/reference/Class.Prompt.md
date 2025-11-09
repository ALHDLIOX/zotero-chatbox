# Class: Prompt

Defined in: [src/managers/prompt.ts:14](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/managers/prompt.ts#L14)

Prompt for setting up or executing some commands quickly.

`Shift + P` can show/hide its UI anywhere after registering commands.

## Constructors

### Constructor

ts

```
new Prompt(): Prompt;
```

Defined in: [src/managers/prompt.ts:54](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/managers/prompt.ts#L54)

Initialize `Prompt` but do not create UI.

#### Returns

`Prompt`

## Properties

### commands

ts

```
commands: Command[] = [];
```

Defined in: [src/managers/prompt.ts:50](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/managers/prompt.ts#L50)

Save all commands registered by all addons.

---

### inputNode

ts

```
inputNode: HTMLInputElement;
```

Defined in: [src/managers/prompt.ts:46](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/managers/prompt.ts#L46)

The HTML input node of `Prompt`.

---

### promptNode

ts

```
promptNode: HTMLDivElement;
```

Defined in: [src/managers/prompt.ts:42](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/managers/prompt.ts#L42)

The top-level HTML div node of `Prompt`

## Accessors

### document

#### Get Signature

ts

```
get document(): Document;
```

Defined in: [src/managers/prompt.ts:17](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/managers/prompt.ts#L17)

##### Returns

`Document`

## Methods

### createCommandNode()

ts

```
createCommandNode(command): HTMLElement;
```

Defined in: [src/managers/prompt.ts:261](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/managers/prompt.ts#L261)

Create a command item for `Prompt` UI.

#### Parameters

##### command

[`Command`](Interface.Command.md)

#### Returns

`HTMLElement`

---

### createCommandsContainer()

ts

```
createCommandsContainer(): HTMLDivElement;
```

Defined in: [src/managers/prompt.ts:228](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/managers/prompt.ts#L228)

Create a `commandsContainer` div element, append to `commandsContainer` and hide others.

#### Returns

`HTMLDivElement`

commandsNode

---

### initializeUI()

ts

```
initializeUI(): void;
```

Defined in: [src/managers/prompt.ts:62](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/managers/prompt.ts#L62)

Initialize `Prompt` UI and then bind events on it.

#### Returns

`void`

---

### selectItem()

ts

```
selectItem(item): void;
```

Defined in: [src/managers/prompt.ts:608](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/managers/prompt.ts#L608)

Mark the selected item with class `selected`.

#### Parameters

##### item

`HTMLDivElement`

HTMLDivElement

#### Returns

`void`

---

### showCommands()

ts

```
showCommands(commands, clear): void;
```

Defined in: [src/managers/prompt.ts:201](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/managers/prompt.ts#L201)

Show commands in a new `commandsContainer` All other `commandsContainer` is hidden

#### Parameters

##### commands

[`Command`](Interface.Command.md)\[\]

Command\[\]

##### clear

`boolean` = `false`

remove all `commandsContainer` if true

#### Returns

`void`

---

### showTip()

ts

```
showTip(text): HTMLDivElement;
```

Defined in: [src/managers/prompt.ts:591](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/managers/prompt.ts#L591)

Create a commandsContainer and display a text

#### Parameters

##### text

`string`

#### Returns

`HTMLDivElement`
