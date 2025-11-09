# Class: ProgressWindowHelper

Defined in: [src/helpers/progressWindow.ts:48](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/progressWindow.ts#L48)

ProgressWindow helper.

## Examples

Show a popup with success icon

ts

```
const tool = new ZoteroTool();
tool.createProgressWindow("Addon").createLine({
  type: "success",
  text: "Finish"
  progress: 100,
}).show();
```

Show a popup and change line content

ts

```
const compat = new ZoteroCompat();
const tool = new ZoteroTool();
const popupWin = tool.createProgressWindow("Addon").createLine({
  text: "Loading"
  progress: 50,
}).show(-1);
// Do operations
compat.getGlobal("setTimeout")(()=>{
  popupWin.changeLine({
    text: "Finish",
    progress: 100,
  });
}, 3000);
```

## Constructors

### Constructor

ts

```
new ProgressWindowHelper(header, options): ProgressWindowHelper;
```

Defined in: [src/helpers/progressWindow.ts:62](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/progressWindow.ts#L62)

#### Parameters

##### header

`string`

window header

##### options

###### closeOnClick?

`boolean`

###### closeOtherProgressWindows?

`boolean`

###### closeTime?

`number`

###### window?

`Window`

#### Returns

`ProgressWindowHelper`

## Properties

### win

ts

```
win: ProgressWindow;
```

Defined in: [src/helpers/progressWindow.ts:49](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/progressWindow.ts#L49)

## Methods

### addDescription()

ts

```
addDescription(text): ProgressWindowHelper;
```

Defined in: [src/helpers/progressWindow.ts:196](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/progressWindow.ts#L196)

#### Parameters

##### text

`string`

#### Returns

`ProgressWindowHelper`

---

### addLines()

ts

```
addLines(labels, icons): ProgressWindowHelper;
```

Defined in: [src/helpers/progressWindow.ts:188](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/progressWindow.ts#L188)

#### Parameters

##### labels

`string` \| { \[`key`: `string` \| `number` \| `symbol`\]: `string`; }

##### icons

`string` \| { \[`key`: `string` \| `number` \| `symbol`\]: `string`; }

#### Returns

`ProgressWindowHelper`

---

### changeHeadline()

ts

```
changeHeadline(
   text,
   icon?,
   postText?): ProgressWindowHelper;
```

Defined in: [src/helpers/progressWindow.ts:183](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/progressWindow.ts#L183)

#### Parameters

##### text

`string`

##### icon?

`string`

##### postText?

`string`

#### Returns

`ProgressWindowHelper`

---

### changeLine()

ts

```
changeLine(options): ProgressWindowHelper;
```

Defined in: [src/helpers/progressWindow.ts:118](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/progressWindow.ts#L118)

Change the line content

#### Parameters

##### options

###### icon?

`string`

###### idx?

`number`

###### progress?

`number`

###### text?

`string`

###### type?

`string`

#### Returns

`ProgressWindowHelper`

---

### close()

ts

```
close(): ProgressWindowHelper;
```

Defined in: [src/helpers/progressWindow.ts:206](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/progressWindow.ts#L206)

#### Returns

`ProgressWindowHelper`

---

### createLine()

ts

```
createLine(options): ProgressWindowHelper;
```

Defined in: [src/helpers/progressWindow.ts:92](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/progressWindow.ts#L92)

Create a new line

#### Parameters

##### options

###### icon?

`string`

###### idx?

`number`

###### progress?

`number`

###### text?

`string`

###### type?

`string`

#### Returns

`ProgressWindowHelper`

---

### show()

ts

```
show(closeTime): ProgressWindowHelper;
```

Defined in: [src/helpers/progressWindow.ts:146](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/progressWindow.ts#L146)

#### Parameters

##### closeTime

`undefined` \| `number`

#### Returns

`ProgressWindowHelper`

---

### startCloseTimer()

ts

```
startCloseTimer(ms, requireMouseOver?): ProgressWindowHelper;
```

Defined in: [src/helpers/progressWindow.ts:201](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/progressWindow.ts#L201)

#### Parameters

##### ms

`number`

##### requireMouseOver?

`boolean`

#### Returns

`ProgressWindowHelper`

---

### setIconURI()

ts

```
static setIconURI(key, uri): void;
```

Defined in: [src/helpers/progressWindow.ts:161](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/progressWindow.ts#L161)

Set custom icon uri for progress window

#### Parameters

##### key

`string`

##### uri

`string`

#### Returns

`void`
