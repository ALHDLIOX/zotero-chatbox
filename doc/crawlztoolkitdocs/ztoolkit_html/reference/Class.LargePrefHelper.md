# Class: LargePrefHelper

Defined in: [src/helpers/largePref.ts:17](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/helpers/largePref.ts#L17)

Helper class for storing large amounts of data in Zotero preferences.

## Remarks

The allowed data length for a single preference is at least 100k, but if this can grow infinitely, like an Array or an Object, there will be significant performance problems.

This class stores the keys of data in a single preference as a JSON string of Array, and stores the values of data in separate preferences.

You can either use the class as a normal object with `asObject()`, or use the methods to access the data.

## Extends

- [`BasicTool`](Class.BasicTool.md)

## Constructors

### Constructor

ts

```
new LargePrefHelper(
   keyPref,
   valuePrefPrefix,
   hooks): LargePrefHelper;
```

Defined in: [src/helpers/largePref.ts:35](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/helpers/largePref.ts#L35)

#### Parameters

##### keyPref

`string`

The preference name for storing the keys of the data.

##### valuePrefPrefix

`string`

The preference name prefix for storing the values of the data.

##### hooks

Hooks for parsing the values of the data.

- `afterGetValue`: A function that takes the value of the data as input and returns the parsed value.
- `beforeSetValue`: A function that takes the key and value of the data as input and returns the parsed key and value. If `hooks` is `"default"`, no parsing will be done. If `hooks` is `"parser"`, the values will be parsed as JSON. If `hooks` is an object, the values will be parsed by the hooks.

`Partial`\<{ `afterGetValue`: (`__namedParameters`) => `object`; `beforeSetValue`: (`__namedParameters`) => `object`; }> \| `"default"` \| `"parser"`

#### Returns

`LargePrefHelper`

#### Overrides

[`BasicTool`](Class.BasicTool.md).[`constructor`](./Class.BasicTool.html#constructor)

## Properties

### \_basicOptions

ts

```
protected _basicOptions: BasicOptions;
```

Defined in: [src/basic.ts:14](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L14)

configurations.

#### Inherited from

[`BasicTool`](Class.BasicTool.md).[`_basicOptions`](./Class.BasicTool.html#basicoptions)

---

### \_console?

ts

```
protected optional _console: Console;
```

Defined in: [src/basic.ts:16](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L16)

#### Inherited from

[`BasicTool`](Class.BasicTool.md).[`_console`](./Class.BasicTool.html#console)

---

### ~~patchSign~~

ts

```
protected readonly patchSign: string = "zotero-plugin-toolkit@3.0.0";
```

Defined in: [src/basic.ts:21](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L21)

#### Deprecated

Use `patcherManager` instead.

#### Inherited from

[`BasicTool`](Class.BasicTool.md).[`patchSign`](./Class.BasicTool.html#patchsign)

---

### \_version

ts

```
static _version: string = version;
```

Defined in: [src/basic.ts:23](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L23)

#### Inherited from

[`BasicTool`](Class.BasicTool.md).[`_version`](./Class.BasicTool.html#version)

## Accessors

### \_version

#### Get Signature

ts

```
get _version(): string;
```

Defined in: [src/basic.ts:28](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L28)

Get version - checks subclass first, then falls back to parent

##### Returns

`string`

#### Inherited from

[`BasicTool`](Class.BasicTool.md).[`_version`](./Class.BasicTool.html#version-1)

---

### basicOptions

#### Get Signature

ts

```
get basicOptions(): BasicOptions;
```

Defined in: [src/basic.ts:32](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L32)

##### Returns

[`BasicOptions`](Interface.BasicOptions.md)

#### Inherited from

[`BasicTool`](Class.BasicTool.md).[`basicOptions`](./Class.BasicTool.html#basicoptions)

## Methods

### \_ensureMainWindowListener()

ts

```
protected _ensureMainWindowListener(): void;
```

Defined in: [src/basic.ts:368](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L368)

Ensure the main window listener is registered.

#### Returns

`void`

#### Inherited from

[`BasicTool`](Class.BasicTool.md).[`_ensureMainWindowListener`](./Class.BasicTool.html#ensuremainwindowlistener)

---

### \_ensurePluginListener()

ts

```
protected _ensurePluginListener(): void;
```

Defined in: [src/basic.ts:418](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L418)

Ensure the plugin listener is registered.

#### Returns

`void`

#### Inherited from

[`BasicTool`](Class.BasicTool.md).[`_ensurePluginListener`](./Class.BasicTool.html#ensurepluginlistener)

---

### \_ensureRemoveListener()

ts

```
protected _ensureRemoveListener(): void;
```

Defined in: [src/basic.ts:349](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L349)

Remove all Zotero event listener callbacks when the last callback is removed.

#### Returns

`void`

#### Inherited from

[`BasicTool`](Class.BasicTool.md).[`_ensureRemoveListener`](./Class.BasicTool.html#ensureremovelistener)

---

### addListenerCallback()

ts

```
addListenerCallback<T>(type, callback): void;
```

Defined in: [src/basic.ts:319](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L319)

Add a Zotero event listener callback

#### Type Parameters

##### T

`T` *extends* keyof `ListenerCallbackMap`

#### Parameters

##### type

`T`

Event type

##### callback

`ListenerCallbackMap`\[`T`\]

Event callback

#### Returns

`void`

#### Inherited from

[`BasicTool`](Class.BasicTool.md).[`addListenerCallback`](./Class.BasicTool.html#addlistenercallback)

---

### asMapLike()

ts

```
asMapLike(): Map<string, any>;
```

Defined in: [src/helpers/largePref.ts:68](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/helpers/largePref.ts#L68)

Get the Map that stores the data.

#### Returns

`Map`\<`string`, `any`\>

The Map that stores the data.

---

### asObject()

ts

```
asObject(): ProxyObj;
```

Defined in: [src/helpers/largePref.ts:60](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/helpers/largePref.ts#L60)

Get the object that stores the data.

#### Returns

`ProxyObj`

The object that stores the data.

---

### createXULElement()

ts

```
createXULElement(doc, type): XULElement;
```

Defined in: [src/basic.ts:212](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L212)

Create an XUL element

For Zotero 6, use `createElementNS`;

For Zotero 7+, use `createXULElement`.

#### Parameters

##### doc

`Document`

##### type

`string`

#### Returns

`XULElement`

#### Example

Create a `<menuitem>`:

ts

```
const compat = new ZoteroCompat();
const doc = compat.getWindow().document;
const elem = compat.createXULElement(doc, "menuitem");
```

#### Inherited from

[`BasicTool`](Class.BasicTool.md).[`createXULElement`](./Class.BasicTool.html#createxulelement)

---

### deleteKey()

ts

```
deleteKey(key): boolean;
```

Defined in: [src/helpers/largePref.ts:194](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/helpers/largePref.ts#L194)

Delete a key.

#### Parameters

##### key

`string`

The key of the data.

#### Returns

`boolean`

---

### getGlobal()

#### Call Signature

ts

```
getGlobal(k): typeof Zotero;
```

Defined in: [src/basic.ts:93](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L93)

**`Alpha`**

##### Parameters

###### k

`"Zotero"` \| `"zotero"`

##### Returns

*typeof* `Zotero`

##### Inherited from

[`BasicTool`](Class.BasicTool.md).[`getGlobal`](./Class.BasicTool.html#getglobal)

#### Call Signature

ts

```
getGlobal(k): ZoteroPane;
```

Defined in: [src/basic.ts:98](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L98)

**`Alpha`**

##### Parameters

###### k

`"ZoteroPane"` \| `"ZoteroPane_Local"`

##### Returns

`ZoteroPane`

##### Inherited from

[`BasicTool`](Class.BasicTool.md).[`getGlobal`](./Class.BasicTool.html#getglobal)

#### Call Signature

ts

```
getGlobal(k): Zotero_Tabs;
```

Defined in: [src/basic.ts:103](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L103)

**`Alpha`**

##### Parameters

###### k

`"Zotero_Tabs"`

##### Returns

`Zotero_Tabs`

##### Inherited from

[`BasicTool`](Class.BasicTool.md).[`getGlobal`](./Class.BasicTool.html#getglobal)

#### Call Signature

ts

```
getGlobal(k): any;
```

Defined in: [src/basic.ts:108](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L108)

**`Alpha`**

##### Parameters

###### k

`"Zotero_File_Interface"`

##### Returns

`any`

##### Inherited from

[`BasicTool`](Class.BasicTool.md).[`getGlobal`](./Class.BasicTool.html#getglobal)

#### Call Signature

ts

```
getGlobal(k): any;
```

Defined in: [src/basic.ts:113](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L113)

**`Alpha`**

##### Parameters

###### k

`"Zotero_File_Exporter"`

##### Returns

`any`

##### Inherited from

[`BasicTool`](Class.BasicTool.md).[`getGlobal`](./Class.BasicTool.html#getglobal)

#### Call Signature

ts

```
getGlobal(k): any;
```

Defined in: [src/basic.ts:118](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L118)

**`Alpha`**

##### Parameters

###### k

`"Zotero_LocateMenu"`

##### Returns

`any`

##### Inherited from

[`BasicTool`](Class.BasicTool.md).[`getGlobal`](./Class.BasicTool.html#getglobal)

#### Call Signature

ts

```
getGlobal(k): any;
```

Defined in: [src/basic.ts:123](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L123)

**`Alpha`**

##### Parameters

###### k

`"Zotero_Report_Interface"`

##### Returns

`any`

##### Inherited from

[`BasicTool`](Class.BasicTool.md).[`getGlobal`](./Class.BasicTool.html#getglobal)

#### Call Signature

ts

```
getGlobal(k): any;
```

Defined in: [src/basic.ts:128](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L128)

**`Alpha`**

##### Parameters

###### k

`"Zotero_Timeline_Interface"`

##### Returns

`any`

##### Inherited from

[`BasicTool`](Class.BasicTool.md).[`getGlobal`](./Class.BasicTool.html#getglobal)

#### Call Signature

ts

```
getGlobal(k): any;
```

Defined in: [src/basic.ts:133](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L133)

**`Alpha`**

##### Parameters

###### k

`"Zotero_Tooltip"`

##### Returns

`any`

##### Inherited from

[`BasicTool`](Class.BasicTool.md).[`getGlobal`](./Class.BasicTool.html#getglobal)

#### Call Signature

ts

```
getGlobal(k): ZoteroContextPane;
```

Defined in: [src/basic.ts:138](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L138)

**`Alpha`**

##### Parameters

###### k

`"ZoteroContextPane"`

##### Returns

`ZoteroContextPane`

##### Inherited from

[`BasicTool`](Class.BasicTool.md).[`getGlobal`](./Class.BasicTool.html#getglobal)

#### Call Signature

ts

```
getGlobal(k): any;
```

Defined in: [src/basic.ts:143](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L143)

**`Alpha`**

##### Parameters

###### k

`"ZoteroItemPane"`

##### Returns

`any`

##### Inherited from

[`BasicTool`](Class.BasicTool.md).[`getGlobal`](./Class.BasicTool.html#getglobal)

#### Call Signature

ts

```
getGlobal<K, GLOBAL>(k): GLOBAL[K];
```

Defined in: [src/basic.ts:148](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L148)

**`Alpha`**

##### Type Parameters

###### K

`K` *extends* \| `"undefined"` \| `"menubar"` \| `"statusbar"` \| `"toolbar"` \| `"window"` \| `"stop"` \| `"length"` \| `"toString"` \| `"onafterprint"` \| `"onbeforeprint"` \| `"onbeforeunload"` \| `"ongamepadconnected"` \| `"ongamepaddisconnected"` \| `"onhashchange"` \| `"onlanguagechange"` \| `"onmessage"` \| `"onmessageerror"` \| `"onoffline"` \| `"ononline"` \| `"onpagehide"` \| `"onpagereveal"` \| `"onpageshow"` \| `"onpageswap"` \| `"onpopstate"` \| `"onrejectionhandled"` \| `"onstorage"` \| `"onunhandledrejection"` \| `"onunload"` \| `"WeakRef"` \| `"top"` \| `"blur"` \| `"close"` \| `"focus"` \| `"scroll"` \| `"document"` \| `"Zotero"` \| `"globalThis"` \| `"eval"` \| `"parseInt"` \| `"parseFloat"` \| `"isNaN"` \| `"isFinite"` \| `"decodeURI"` \| `"decodeURIComponent"` \| `"encodeURI"` \| `"encodeURIComponent"` \| `"escape"` \| `"unescape"` \| `"NaN"` \| `"Infinity"` \| `"Symbol"` \| `"Object"` \| `"Function"` \| `"String"` \| `"Boolean"` \| `"Number"` \| `"Math"` \| `"Date"` \| `"RegExp"` \| `"Error"` \| `"EvalError"` \| `"RangeError"` \| `"ReferenceError"` \| `"SyntaxError"` \| `"TypeError"` \| `"URIError"` \| `"JSON"` \| `"Array"` \| `"Promise"` \| `"ArrayBuffer"` \| `"DataView"` \| `"Int8Array"` \| `"Uint8Array"` \| `"Uint8ClampedArray"` \| `"Int16Array"` \| `"Uint16Array"` \| `"Int32Array"` \| `"Uint32Array"` \| `"Float32Array"` \| `"Float64Array"` \| `"Intl"` \| `"alert"` \| `"cancelIdleCallback"` \| `"captureEvents"` \| `"confirm"` \| `"getComputedStyle"` \| `"getSelection"` \| `"matchMedia"` \| `"moveBy"` \| `"moveTo"` \| `"open"` \| `"postMessage"` \| `"print"` \| `"prompt"` \| `"releaseEvents"` \| `"requestIdleCallback"` \| `"resizeBy"` \| `"resizeTo"` \| `"scrollBy"` \| `"scrollTo"` \| `"dispatchEvent"` \| `"cancelAnimationFrame"` \| `"requestAnimationFrame"` \| `"atob"` \| `"btoa"` \| `"clearInterval"` \| `"clearTimeout"` \| `"createImageBitmap"` \| `"fetch"` \| `"queueMicrotask"` \| `"reportError"` \| `"setInterval"` \| `"setTimeout"` \| `"structuredClone"` \| `"addEventListener"` \| `"removeEventListener"` \| `"NodeFilter"` \| `"AbortController"` \| `"AbortSignal"` \| `"AbstractRange"` \| `"AnalyserNode"` \| `"Animation"` \| `"AnimationEffect"` \| `"AnimationEvent"` \| `"AnimationPlaybackEvent"` \| `"AnimationTimeline"` \| `"Attr"` \| `"AudioBuffer"` \| `"AudioBufferSourceNode"` \| `"AudioContext"` \| `"AudioData"` \| `"AudioDecoder"` \| `"AudioDestinationNode"` \| `"AudioEncoder"` \| `"AudioListener"` \| `"AudioNode"` \| `"AudioParam"` \| `"AudioParamMap"` \| `"AudioProcessingEvent"` \| `"AudioScheduledSourceNode"` \| `"AudioWorklet"` \| `"AudioWorkletNode"` \| `"AuthenticatorAssertionResponse"` \| `"AuthenticatorAttestationResponse"` \| `"AuthenticatorResponse"` \| `"BarProp"` \| `"BaseAudioContext"` \| `"BeforeUnloadEvent"` \| `"BiquadFilterNode"` \| `"Blob"` \| `"BlobEvent"` \| `"BroadcastChannel"` \| `"ByteLengthQueuingStrategy"` \| `"CDATASection"` \| `"CSPViolationReportBody"` \| `"CSSAnimation"` \| `"CSSConditionRule"` \| `"CSSContainerRule"` \| `"CSSCounterStyleRule"` \| `"CSSFontFaceRule"` \| `"CSSFontFeatureValuesRule"` \| `"CSSFontPaletteValuesRule"` \| `"CSSGroupingRule"` \| `"CSSImageValue"` \| `"CSSImportRule"` \| `"CSSKeyframeRule"` \| `"CSSKeyframesRule"` \| `"CSSKeywordValue"` \| `"CSSLayerBlockRule"` \| `"CSSLayerStatementRule"` \| `"CSSMathClamp"` \| `"CSSMathInvert"` \| `"CSSMathMax"` \| `"CSSMathMin"` \| `"CSSMathNegate"` \| `"CSSMathProduct"` \| `"CSSMathSum"` \| `"CSSMathValue"` \| `"CSSMatrixComponent"` \| `"CSSMediaRule"` \| `"CSSNamespaceRule"` \| `"CSSNestedDeclarations"` \| `"CSSNumericArray"` \| `"CSSNumericValue"` \| `"CSSPageRule"` \| `"CSSPerspective"` \| `"CSSPropertyRule"` \| `"CSSRotate"` \| `"CSSRule"` \| `"CSSRuleList"` \| `"CSSScale"` \| `"CSSScopeRule"` \| `"CSSSkew"` \| `"CSSSkewX"` \| `"CSSSkewY"` \| `"CSSStartingStyleRule"` \| `"CSSStyleDeclaration"` \| `"CSSStyleRule"` \| `"CSSStyleSheet"` \| `"CSSStyleValue"` \| `"CSSSupportsRule"` \| `"CSSTransformComponent"` \| `"CSSTransformValue"` \| `"CSSTransition"` \| `"CSSTranslate"` \| `"CSSUnitValue"` \| `"CSSUnparsedValue"` \| `"CSSVariableReferenceValue"` \| `"CSSViewTransitionRule"` \| `"Cache"` \| `"CacheStorage"` \| `"CanvasCaptureMediaStreamTrack"` \| `"CanvasGradient"` \| `"CanvasPattern"` \| `"CanvasRenderingContext2D"` \| `"CaretPosition"` \| `"ChannelMergerNode"` \| `"ChannelSplitterNode"` \| `"CharacterData"` \| `"Clipboard"` \| `"ClipboardEvent"` \| `"ClipboardItem"` \| `"CloseEvent"` \| `"Comment"` \| `"CompositionEvent"` \| `"CompressionStream"` \| `"ConstantSourceNode"` \| `"ContentVisibilityAutoStateChangeEvent"` \| `"ConvolverNode"` \| `"CookieChangeEvent"` \| `"CookieStore"` \| `"CookieStoreManager"` \| `"CountQueuingStrategy"` \| `"Credential"` \| `"CredentialsContainer"` \| `"Crypto"` \| `"CryptoKey"` \| `"CustomElementRegistry"` \| `"CustomEvent"` \| `"CustomStateSet"` \| `"DOMException"` \| `"DOMImplementation"` \| `"DOMMatrix"` \| `"SVGMatrix"` \| `"WebKitCSSMatrix"` \| `"DOMMatrixReadOnly"` \| `"DOMParser"` \| `"DOMPoint"` \| `"SVGPoint"` \| `"DOMPointReadOnly"` \| `"DOMQuad"` \| `"DOMRect"` \| `"SVGRect"` \| `"DOMRectList"` \| `"DOMRectReadOnly"` \| `"DOMStringList"` \| `"DOMStringMap"` \| `"DOMTokenList"` \| `"DataTransfer"` \| `"DataTransferItem"` \| `"DataTransferItemList"` \| `"DecompressionStream"` \| `"DelayNode"` \| `"DeviceMotionEvent"` \| `"DeviceOrientationEvent"` \| `"Document"` \| `"DocumentFragment"` \| `"DocumentTimeline"` \| `"DocumentType"` \| `"DragEvent"` \| `"DynamicsCompressorNode"` \| `"Element"` \| `"ElementInternals"` \| `"EncodedAudioChunk"` \| `"EncodedVideoChunk"` \| `"ErrorEvent"` \| `"Event"` \| `"EventCounts"` \| `"EventSource"` \| `"EventTarget"` \| `"External"` \| `"File"` \| `"FileList"` \| `"FileReader"` \| `"FileSystem"` \| `"FileSystemDirectoryEntry"` \| `"FileSystemDirectoryHandle"` \| `"FileSystemDirectoryReader"` \| `"FileSystemEntry"` \| `"FileSystemFileEntry"` \| `"FileSystemFileHandle"` \| `"FileSystemHandle"` \| `"FileSystemWritableFileStream"` \| `"FocusEvent"` \| `"FontFace"` \| `"FontFaceSet"` \| `"FontFaceSetLoadEvent"` \| `"FormData"` \| `"FormDataEvent"` \| `"FragmentDirective"` \| `"GPUError"` \| `"GainNode"` \| `"Gamepad"` \| `"GamepadButton"` \| `"GamepadEvent"` \| `"GamepadHapticActuator"` \| `"Geolocation"` \| `"GeolocationCoordinates"` \| `"GeolocationPosition"` \| `"GeolocationPositionError"` \| `"HTMLAllCollection"` \| `"HTMLAnchorElement"` \| `"HTMLAreaElement"` \| `"HTMLAudioElement"` \| `"HTMLBRElement"` \| `"HTMLBaseElement"` \| `"HTMLBodyElement"` \| `"HTMLButtonElement"` \| `"HTMLCanvasElement"` \| `"HTMLCollection"` \| `"HTMLDListElement"` \| `"HTMLDataElement"` \| `"HTMLDataListElement"` \| `"HTMLDetailsElement"` \| `"HTMLDialogElement"` \| `"HTMLDirectoryElement"` \| `"HTMLDivElement"` \| `"HTMLDocument"` \| `"HTMLElement"` \| `"HTMLEmbedElement"` \| `"HTMLFieldSetElement"` \| `"HTMLFontElement"` \| `"HTMLFormControlsCollection"` \| `"HTMLFormElement"` \| `"HTMLFrameElement"` \| `"HTMLFrameSetElement"` \| `"HTMLHRElement"` \| `"HTMLHeadElement"` \| `"HTMLHeadingElement"` \| `"HTMLHtmlElement"` \| `"HTMLIFrameElement"` \| `"HTMLImageElement"` \| `"HTMLInputElement"` \| `"HTMLLIElement"` \| `"HTMLLabelElement"` \| `"HTMLLegendElement"` \| `"HTMLLinkElement"` \| `"HTMLMapElement"` \| `"HTMLMarqueeElement"` \| `"HTMLMediaElement"` \| `"HTMLMenuElement"` \| `"HTMLMetaElement"` \| `"HTMLMeterElement"` \| `"HTMLModElement"` \| `"HTMLOListElement"` \| `"HTMLObjectElement"` \| `"HTMLOptGroupElement"` \| `"HTMLOptionElement"` \| `"HTMLOptionsCollection"` \| `"HTMLOutputElement"` \| `"HTMLParagraphElement"` \| `"HTMLParamElement"` \| `"HTMLPictureElement"` \| `"HTMLPreElement"` \| `"HTMLProgressElement"` \| `"HTMLQuoteElement"` \| `"HTMLScriptElement"` \| `"HTMLSelectElement"` \| `"HTMLSlotElement"` \| `"HTMLSourceElement"` \| `"HTMLSpanElement"` \| `"HTMLStyleElement"` \| `"HTMLTableCaptionElement"` \| `"HTMLTableCellElement"` \| `"HTMLTableColElement"` \| `"HTMLTableElement"` \| `"HTMLTableRowElement"` \| `"HTMLTableSectionElement"` \| `"HTMLTemplateElement"` \| `"HTMLTextAreaElement"` \| `"HTMLTimeElement"` \| `"HTMLTitleElement"` \| `"HTMLTrackElement"` \| `"HTMLUListElement"` \| `"HTMLUnknownElement"` \| `"HTMLVideoElement"` \| `"HashChangeEvent"` \| `"Headers"` \| `"Highlight"` \| `"HighlightRegistry"` \| `"History"` \| `"IDBCursor"` \| `"IDBCursorWithValue"` \| `"IDBDatabase"` \| `"IDBFactory"` \| `"IDBIndex"` \| `"IDBKeyRange"` \| `"IDBObjectStore"` \| `"IDBOpenDBRequest"` \| `"IDBRequest"` \| `"IDBTransaction"` \| `"IDBVersionChangeEvent"` \| `"IIRFilterNode"` \| `"IdleDeadline"` \| `"ImageBitmap"` \| `"ImageBitmapRenderingContext"` \| `"ImageCapture"` \| `"ImageData"` \| `"ImageDecoder"` \| `"ImageTrack"` \| `"ImageTrackList"` \| `"InputDeviceInfo"` \| `"InputEvent"` \| `"IntersectionObserver"` \| `"IntersectionObserverEntry"` \| `"KeyboardEvent"` \| `"KeyframeEffect"` \| `"LargestContentfulPaint"` \| `"Location"` \| `"Lock"` \| `"LockManager"` \| `"MIDIAccess"` \| `"MIDIConnectionEvent"` \| `"MIDIInput"` \| `"MIDIInputMap"` \| `"MIDIMessageEvent"` \| `"MIDIOutput"` \| `"MIDIOutputMap"` \| `"MIDIPort"` \| `"MathMLElement"` \| `"MediaCapabilities"` \| `"MediaDeviceInfo"` \| `"MediaDevices"` \| `"MediaElementAudioSourceNode"` \| `"MediaEncryptedEvent"` \| `"MediaError"` \| `"MediaKeyMessageEvent"` \| `"MediaKeySession"` \| `"MediaKeyStatusMap"` \| `"MediaKeySystemAccess"` \| `"MediaKeys"` \| `"MediaList"` \| `"MediaMetadata"` \| `"MediaQueryList"` \| `"MediaQueryListEvent"` \| `"MediaRecorder"` \| `"MediaSession"` \| `"MediaSource"` \| `"MediaSourceHandle"` \| `"MediaStream"` \| `"MediaStreamAudioDestinationNode"` \| `"MediaStreamAudioSourceNode"` \| `"MediaStreamTrack"` \| `"MediaStreamTrackEvent"` \| `"MessageChannel"` \| `"MessageEvent"` \| `"MessagePort"` \| `"MimeType"` \| `"MimeTypeArray"` \| `"MouseEvent"` \| `"MutationObserver"` \| `"MutationRecord"` \| `"NamedNodeMap"` \| `"NavigationActivation"` \| `"NavigationHistoryEntry"` \| `"NavigationPreloadManager"` \| `"Navigator"` \| `"NavigatorLogin"` \| `"Node"` \| `"NodeIterator"` \| `"NodeList"` \| `"Notification"` \| `"OfflineAudioCompletionEvent"` \| `"OfflineAudioContext"` \| `"OffscreenCanvas"` \| `"OffscreenCanvasRenderingContext2D"` \| `"OscillatorNode"` \| `"OverconstrainedError"` \| `"PageRevealEvent"` \| `"PageSwapEvent"` \| `"PageTransitionEvent"` \| `"PannerNode"` \| `"Path2D"` \| `"PaymentAddress"` \| `"PaymentMethodChangeEvent"` \| `"PaymentRequest"` \| `"PaymentRequestUpdateEvent"` \| `"PaymentResponse"` \| `"Performance"` \| `"PerformanceEntry"` \| `"PerformanceEventTiming"` \| `"PerformanceMark"` \| `"PerformanceMeasure"` \| `"PerformanceNavigation"` \| `"PerformanceNavigationTiming"` \| `"PerformanceObserver"` \| `"PerformanceObserverEntryList"` \| `"PerformancePaintTiming"` \| `"PerformanceResourceTiming"` \| `"PerformanceServerTiming"` \| `"PerformanceTiming"` \| `"PeriodicWave"` \| `"PermissionStatus"` \| `"Permissions"` \| `"PictureInPictureEvent"` \| `"PictureInPictureWindow"` \| `"Plugin"` \| `"PluginArray"` \| `"PointerEvent"` \| `"PopStateEvent"` \| `"ProcessingInstruction"` \| `"ProgressEvent"` \| `"PromiseRejectionEvent"` \| `"PublicKeyCredential"` \| `"PushManager"` \| `"PushSubscription"` \| `"PushSubscriptionOptions"` \| `"RTCCertificate"` \| `"RTCDTMFSender"` \| `"RTCDTMFToneChangeEvent"` \| `"RTCDataChannel"` \| `"RTCDataChannelEvent"` \| `"RTCDtlsTransport"` \| `"RTCEncodedAudioFrame"` \| `"RTCEncodedVideoFrame"` \| `"RTCError"` \| `"RTCErrorEvent"` \| `"RTCIceCandidate"` \| `"RTCIceTransport"` \| `"RTCPeerConnection"` \| `"RTCPeerConnectionIceErrorEvent"` \| `"RTCPeerConnectionIceEvent"` \| `"RTCRtpReceiver"` \| `"RTCRtpScriptTransform"` \| `"RTCRtpSender"` \| `"RTCRtpTransceiver"` \| `"RTCSctpTransport"` \| `"RTCSessionDescription"` \| `"RTCStatsReport"` \| `"RTCTrackEvent"` \| `"RadioNodeList"` \| `"Range"` \| `"ReadableByteStreamController"` \| `"ReadableStream"` \| `"ReadableStreamBYOBReader"` \| `"ReadableStreamBYOBRequest"` \| `"ReadableStreamDefaultController"` \| `"ReadableStreamDefaultReader"` \| `"RemotePlayback"` \| `"Report"` \| `"ReportBody"` \| `"ReportingObserver"` \| `"Request"` \| `"ResizeObserver"` \| `"ResizeObserverEntry"` \| `"ResizeObserverSize"` \| `"Response"` \| `"SVGAElement"` \| `"SVGAngle"` \| `"SVGAnimateElement"` \| `"SVGAnimateMotionElement"` \| `"SVGAnimateTransformElement"` \| `"SVGAnimatedAngle"` \| `"SVGAnimatedBoolean"` \| `"SVGAnimatedEnumeration"` \| `"SVGAnimatedInteger"` \| `"SVGAnimatedLength"` \| `"SVGAnimatedLengthList"` \| `"SVGAnimatedNumber"` \| `"SVGAnimatedNumberList"` \| `"SVGAnimatedPreserveAspectRatio"` \| `"SVGAnimatedRect"` \| `"SVGAnimatedString"` \| `"SVGAnimatedTransformList"` \| `"SVGAnimationElement"` \| `"SVGCircleElement"` \| `"SVGClipPathElement"` \| `"SVGComponentTransferFunctionElement"` \| `"SVGDefsElement"` \| `"SVGDescElement"` \| `"SVGElement"` \| `"SVGEllipseElement"` \| `"SVGFEBlendElement"` \| `"SVGFEColorMatrixElement"` \| `"SVGFEComponentTransferElement"` \| `"SVGFECompositeElement"` \| `"SVGFEConvolveMatrixElement"` \| `"SVGFEDiffuseLightingElement"` \| `"SVGFEDisplacementMapElement"` \| `"SVGFEDistantLightElement"` \| `"SVGFEDropShadowElement"` \| `"SVGFEFloodElement"` \| `"SVGFEFuncAElement"` \| `"SVGFEFuncBElement"` \| `"SVGFEFuncGElement"` \| `"SVGFEFuncRElement"` \| `"SVGFEGaussianBlurElement"` \| `"SVGFEImageElement"` \| `"SVGFEMergeElement"` \| `"SVGFEMergeNodeElement"` \| `"SVGFEMorphologyElement"` \| `"SVGFEOffsetElement"` \| `"SVGFEPointLightElement"` \| `"SVGFESpecularLightingElement"` \| `"SVGFESpotLightElement"` \| `"SVGFETileElement"` \| `"SVGFETurbulenceElement"` \| `"SVGFilterElement"` \| `"SVGForeignObjectElement"` \| `"SVGGElement"` \| `"SVGGeometryElement"` \| `"SVGGradientElement"` \| `"SVGGraphicsElement"` \| `"SVGImageElement"` \| `"SVGLength"` \| `"SVGLengthList"` \| `"SVGLineElement"` \| `"SVGLinearGradientElement"` \| `"SVGMPathElement"` \| `"SVGMarkerElement"` \| `"SVGMaskElement"` \| `"SVGMetadataElement"` \| `"SVGNumber"` \| `"SVGNumberList"` \| `"SVGPathElement"` \| `"SVGPatternElement"` \| `"SVGPointList"` \| `"SVGPolygonElement"` \| `"SVGPolylineElement"` \| `"SVGPreserveAspectRatio"` \| `"SVGRadialGradientElement"` \| `"SVGRectElement"` \| `"SVGSVGElement"` \| `"SVGScriptElement"` \| `"SVGSetElement"` \| `"SVGStopElement"` \| `"SVGStringList"` \| `"SVGStyleElement"` \| `"SVGSwitchElement"` \| `"SVGSymbolElement"` \| `"SVGTSpanElement"` \| `"SVGTextContentElement"` \| `"SVGTextElement"` \| `"SVGTextPathElement"` \| `"SVGTextPositioningElement"` \| `"SVGTitleElement"` \| `"SVGTransform"` \| `"SVGTransformList"` \| `"SVGUnitTypes"` \| `"SVGUseElement"` \| `"SVGViewElement"` \| `"Screen"` \| `"ScreenOrientation"` \| `"ScriptProcessorNode"` \| `"SecurityPolicyViolationEvent"` \| `"Selection"` \| `"ServiceWorker"` \| `"ServiceWorkerContainer"` \| `"ServiceWorkerRegistration"` \| `"ShadowRoot"` \| `"SharedWorker"` \| `"SourceBuffer"` \| `"SourceBufferList"` \| `"SpeechRecognitionAlternative"` \| `"SpeechRecognitionResult"` \| `"SpeechRecognitionResultList"` \| `"SpeechSynthesis"` \| `"SpeechSynthesisErrorEvent"` \| `"SpeechSynthesisEvent"` \| `"SpeechSynthesisUtterance"` \| `"SpeechSynthesisVoice"` \| `"StaticRange"` \| `"StereoPannerNode"` \| `"Storage"` \| `"StorageEvent"` \| `"StorageManager"` \| `"StylePropertyMap"` \| `"StylePropertyMapReadOnly"` \| `"StyleSheet"` \| `"StyleSheetList"` \| `"SubmitEvent"` \| `"SubtleCrypto"` \| `"Text"` \| `"TextDecoder"` \| `"TextDecoderStream"` \| `"TextEncoder"` \| `"TextEncoderStream"` \| `"TextEvent"` \| `"TextMetrics"` \| `"TextTrack"` \| `"TextTrackCue"` \| `"TextTrackCueList"` \| `"TextTrackList"` \| `"TimeRanges"` \| `"ToggleEvent"` \| `"Touch"` \| `"TouchEvent"` \| `"TouchList"` \| `"TrackEvent"` \| `"TransformStream"` \| `"TransformStreamDefaultController"` \| `"TransitionEvent"` \| `"TreeWalker"` \| `"UIEvent"` \| `"URL"` \| `"webkitURL"` \| `"URLSearchParams"` \| `"UserActivation"` \| `"VTTCue"` \| `"VTTRegion"` \| `"ValidityState"` \| `"VideoColorSpace"` \| `"VideoDecoder"` \| `"VideoEncoder"` \| `"VideoFrame"` \| `"VideoPlaybackQuality"` \| `"ViewTransition"` \| `"ViewTransitionTypeSet"` \| `"VisualViewport"` \| `"WakeLock"` \| `"WakeLockSentinel"` \| `"WaveShaperNode"` \| `"WebGL2RenderingContext"` \| `"WebGLActiveInfo"` \| `"WebGLBuffer"` \| `"WebGLContextEvent"` \| `"WebGLFramebuffer"` \| `"WebGLProgram"` \| `"WebGLQuery"` \| `"WebGLRenderbuffer"` \| `"WebGLRenderingContext"` \| `"WebGLSampler"` \| `"WebGLShader"` \| `"WebGLShaderPrecisionFormat"` \| `"WebGLSync"` \| `"WebGLTexture"` \| `"WebGLTransformFeedback"` \| `"WebGLUniformLocation"` \| `"WebGLVertexArrayObject"` \| `"WebSocket"` \| `"WebTransport"` \| `"WebTransportBidirectionalStream"` \| `"WebTransportDatagramDuplexStream"` \| `"WebTransportError"` \| `"WheelEvent"` \| `"Window"` \| `"Worker"` \| `"Worklet"` \| `"WritableStream"` \| `"WritableStreamDefaultController"` \| `"WritableStreamDefaultWriter"` \| `"XMLDocument"` \| `"XMLHttpRequest"` \| `"XMLHttpRequestEventTarget"` \| `"XMLHttpRequestUpload"` \| `"XMLSerializer"` \| `"XPathEvaluator"` \| `"XPathExpression"` \| `"XPathResult"` \| `"XSLTProcessor"` \| `"CSS"` \| `"WebAssembly"` \| `"console"` \| `"Audio"` \| `"Image"` \| `"Option"` \| `"clientInformation"` \| `"closed"` \| `"cookieStore"` \| `"customElements"` \| `"devicePixelRatio"` \| `"event"` \| `"external"` \| `"frameElement"` \| `"frames"` \| `"history"` \| `"innerHeight"` \| `"innerWidth"` \| `"location"` \| `"locationbar"` \| `"navigator"` \| `"ondevicemotion"` \| `"ondeviceorientation"` \| `"ondeviceorientationabsolute"` \| `"onorientationchange"` \| `"opener"` \| `"orientation"` \| `"originAgentCluster"` \| `"outerHeight"` \| `"outerWidth"` \| `"pageXOffset"` \| `"pageYOffset"` \| `"parent"` \| `"personalbar"` \| `"screen"` \| `"screenLeft"` \| `"screenTop"` \| `"screenX"` \| `"screenY"` \| `"scrollX"` \| `"scrollY"` \| `"scrollbars"` \| `"self"` \| `"speechSynthesis"` \| `"status"` \| `"visualViewport"` \| `"onabort"` \| `"onanimationcancel"` \| `"onanimationend"` \| `"onanimationiteration"` \| `"onanimationstart"` \| `"onauxclick"` \| `"onbeforeinput"` \| `"onbeforematch"` \| `"onbeforetoggle"` \| `"onblur"` \| `"oncancel"` \| `"oncanplay"` \| `"oncanplaythrough"` \| `"onchange"` \| `"onclick"` \| `"onclose"` \| `"oncontextlost"` \| `"oncontextmenu"` \| `"oncontextrestored"` \| `"oncopy"` \| `"oncuechange"` \| `"oncut"` \| `"ondblclick"` \| `"ondrag"` \| `"ondragend"` \| `"ondragenter"` \| `"ondragleave"` \| `"ondragover"` \| `"ondragstart"` \| `"ondrop"` \| `"ondurationchange"` \| `"onemptied"` \| `"onended"` \| `"onerror"` \| `"onfocus"` \| `"onformdata"` \| `"ongotpointercapture"` \| `"oninput"` \| `"oninvalid"` \| `"onkeydown"` \| `"onkeypress"` \| `"onkeyup"` \| `"onload"` \| `"onloadeddata"` \| `"onloadedmetadata"` \| `"onloadstart"` \| `"onlostpointercapture"` \| `"onmousedown"` \| `"onmouseenter"` \| `"onmouseleave"` \| `"onmousemove"` \| `"onmouseout"` \| `"onmouseover"` \| `"onmouseup"` \| `"onpaste"` \| `"onpause"` \| `"onplay"` \| `"onplaying"` \| `"onpointercancel"` \| `"onpointerdown"` \| `"onpointerenter"` \| `"onpointerleave"` \| `"onpointermove"` \| `"onpointerout"` \| `"onpointerover"` \| `"onpointerrawupdate"` \| `"onpointerup"` \| `"onprogress"` \| `"onratechange"` \| `"onreset"` \| `"onresize"` \| `"onscroll"` \| `"onscrollend"` \| `"onsecuritypolicyviolation"` \| `"onseeked"` \| `"onseeking"` \| `"onselect"` \| `"onselectionchange"` \| `"onselectstart"` \| `"onslotchange"` \| `"onstalled"` \| `"onsubmit"` \| `"onsuspend"` \| `"ontimeupdate"` \| `"ontoggle"` \| `"ontouchcancel"` \| `"ontouchend"` \| `"ontouchmove"` \| `"ontouchstart"` \| `"ontransitioncancel"` \| `"ontransitionend"` \| `"ontransitionrun"` \| `"ontransitionstart"` \| `"onvolumechange"` \| `"onwaiting"` \| `"onwebkitanimationend"` \| `"onwebkitanimationiteration"` \| `"onwebkitanimationstart"` \| `"onwebkittransitionend"` \| `"onwheel"` \| `"localStorage"` \| `"caches"` \| `"crossOriginIsolated"` \| `"crypto"` \| `"indexedDB"` \| `"isSecureContext"` \| `"origin"` \| `"performance"` \| `"sessionStorage"` \| `"importScripts"` \| `"Client"` \| `"Clients"` \| `"DedicatedWorkerGlobalScope"` \| `"ExtendableCookieChangeEvent"` \| `"ExtendableEvent"` \| `"ExtendableMessageEvent"` \| `"FetchEvent"` \| `"FileReaderSync"` \| `"FileSystemSyncAccessHandle"` \| `"MediaStreamTrackProcessor"` \| `"NotificationEvent"` \| `"PushEvent"` \| `"PushMessageData"` \| `"PushSubscriptionChangeEvent"` \| `"RTCRtpScriptTransformer"` \| `"RTCTransformEvent"` \| `"ServiceWorkerGlobalScope"` \| `"SharedWorkerGlobalScope"` \| `"WindowClient"` \| `"WorkerGlobalScope"` \| `"WorkerLocation"` \| `"WorkerNavigator"` \| `"onrtctransform"` \| `"fonts"` \| `"Map"` \| `"WeakMap"` \| `"Set"` \| `"WeakSet"` \| `"Iterator"` \| `"Proxy"` \| `"Reflect"` \| `"SharedArrayBuffer"` \| `"Atomics"` \| `"BigInt"` \| `"BigInt64Array"` \| `"BigUint64Array"` \| `"AggregateError"` \| `"FinalizationRegistry"` \| `"SuppressedError"` \| `"DisposableStack"` \| `"AsyncDisposableStack"` \| `"Float16Array"` \| `"TrustedHTML"` \| `"React"` \| `"ReactDOM"` \| `"AccessibleNode"` \| `"Addon"` \| `"AddonEvent"` \| `"AddonInstall"` \| `"AddonManager"` \| `"AnonymousContent"` \| `"AudioTrack"` \| `"AudioTrackList"` \| `"BatteryManager"` \| `"BrowsingContext"` \| `"BrowsingContextGroup"` \| `"CSSCustomPropertyRegisteredEvent"` \| `"CSSMarginRule"` \| `"CSSMozDocumentRule"` \| `"CSSPositionTryRule"` \| `"CSSPseudoElement"` \| `"CallbackDebuggerNotification"` \| `"CanonicalBrowsingContext"` \| `"CanvasCaptureMediaStream"` \| `"CaretStateChangedEvent"` \| `"ChannelWrapper"` \| `"CheckerboardReportService"` \| `"ChildProcessMessageManager"` \| `"ChildSHistory"` \| `"ChromeMessageBroadcaster"` \| `"ChromeMessageSender"` \| `"ChromeNodeList"` \| `"ChromeWorker"` \| `"ClonedErrorHolder"` \| `"CloseWatcher"` \| `"CommandEvent"` \| `"ConsoleInstance"` \| `"ContentFrameMessageManager"` \| `"ContentProcessMessageManager"` \| `"CreateOfferRequest"` \| `"DOMLocalization"` \| `"DebuggerNotification"` \| `"DebuggerNotificationObserver"` \| `"DeprecationReportBody"` \| `"DeviceLightEvent"` \| `"Directory"` \| `"DominatorTree"` \| `"EventCallbackDebuggerNotification"` \| `"FeaturePolicyViolationReportBody"` \| `"FetchObserver"` \| `"Flex"` \| `"FlexItemValues"` \| `"FlexLineValues"` \| `"FluentBundle"` \| `"FluentPattern"` \| `"FluentResource"` \| `"FrameCrashedEvent"` \| `"FrameLoader"` \| `"GPU"` \| `"GPUAdapter"` \| `"GPUAdapterInfo"` \| `"GPUBindGroup"` \| `"GPUBindGroupLayout"` \| `"GPUBuffer"` \| `"GPUCanvasContext"` \| `"GPUCommandBuffer"` \| `"GPUCommandEncoder"` \| `"GPUCompilationInfo"` \| `"GPUCompilationMessage"` \| `"GPUComputePassEncoder"` \| `"GPUComputePipeline"` \| `"GPUDevice"` \| `"GPUDeviceLostInfo"` \| `"GPUExternalTexture"` \| `"GPUInternalError"` \| `"GPUOutOfMemoryError"` \| `"GPUPipelineError"` \| `"GPUPipelineLayout"` \| `"GPUQuerySet"` \| `"GPUQueue"` \| `"GPURenderBundle"` \| `"GPURenderBundleEncoder"` \| `"GPURenderPassEncoder"` \| `"GPURenderPipeline"` \| `"GPUSampler"` \| `"GPUShaderModule"` \| `"GPUSupportedFeatures"` \| `"GPUSupportedLimits"` \| `"GPUTexture"` \| `"GPUTextureView"` \| `"GPUUncapturedErrorEvent"` \| `"GPUValidationError"` \| `"GamepadAxisMoveEvent"` \| `"GamepadButtonEvent"` \| `"GamepadLightIndicator"` \| `"GamepadPose"` \| `"GamepadServiceTest"` \| `"GamepadTouch"` \| `"GleanBoolean"` \| `"GleanCategory"` \| `"GleanCounter"` \| `"GleanCustomDistribution"` \| `"GleanDatetime"` \| `"GleanDenominator"` \| `"GleanEvent"` \| `"GleanImpl"` \| `"GleanLabeled"` \| `"GleanMemoryDistribution"` \| `"GleanMetric"` \| `"GleanNumerator"` \| `"GleanObject"` \| `"GleanPingsImpl"` \| `"GleanQuantity"` \| `"GleanRate"` \| `"GleanString"` \| `"GleanStringList"` \| `"GleanText"` \| `"GleanTimespan"` \| `"GleanTimingDistribution"` \| `"GleanUrl"` \| `"GleanUuid"` \| `"Grid"` \| `"GridArea"` \| `"GridDimension"` \| `"GridLine"` \| `"GridLines"` \| `"GridTrack"` \| `"GridTracks"` \| `"HeapSnapshot"` \| `"IdentityCredential"` \| `"ImageCaptureErrorEvent"` \| `"ImageDocument"` \| `"InspectorCSSParser"` \| `"InspectorFontFace"` \| `"InstallTriggerImpl"` \| `"InvokeEvent"` \| `"JSProcessActorChild"` \| `"JSProcessActorParent"` \| `"JSWindowActorChild"` \| `"JSWindowActorParent"` \| `"KeyEvent"` \| `"L10nFileSource"` \| `"L10nRegistry"` \| `"Localization"` \| `"MLS"` \| `"MLSGroupView"` \| `"MatchGlob"` \| `"MatchPattern"` \| `"MatchPatternSet"` \| `"MediaController"` \| `"MediaKeyError"` \| `"MediaRecorderErrorEvent"` \| `"MediaStreamEvent"` \| `"MediaStreamTrackAudioSourceNode"` \| `"MerchantValidationEvent"` \| `"MessageBroadcaster"` \| `"MessageListenerManager"` \| `"MessageSender"` \| `"MouseScrollEvent"` \| `"MozCanvasPrintState"` \| `"MozDocumentMatcher"` \| `"MozDocumentObserver"` \| `"MozQueryInterface"` \| `"MozSharedMap"` \| `"MozSharedMapChangeEvent"` \| `"MozStorageAsyncStatementParams"` \| `"MozStorageStatementParams"` \| `"MozStorageStatementRow"` \| `"MozWritableSharedMap"` \| `"MutationEvent"` \| `"NavigateEvent"` \| `"Navigation"` \| `"NavigationCurrentEntryChangeEvent"` \| `"NavigationDestination"` \| `"NavigationTransition"` \| `"NetworkInformation"` \| `"NotifyPaintEvent"` \| `"PaintRequest"` \| `"PaintRequestList"` \| `"ParentProcessMessageManager"` \| `"PeerConnectionImpl"` \| `"PeerConnectionObserver"` \| `"PerformanceEntryEvent"` \| `"PlacesBookmark"` \| `"PlacesBookmarkAddition"` \| `"PlacesBookmarkChanged"` \| `"PlacesBookmarkGuid"` \| `"PlacesBookmarkKeyword"` \| `"PlacesBookmarkMoved"` \| `"PlacesBookmarkRemoved"` \| `"PlacesBookmarkTags"` \| `"PlacesBookmarkTime"` \| `"PlacesBookmarkTitle"` \| `"PlacesBookmarkUrl"` \| `"PlacesEvent"` \| `"PlacesEventCounts"` \| `"PlacesFavicon"` \| `"PlacesHistoryCleared"` \| `"PlacesPurgeCaches"` \| `"PlacesRanking"` \| `"PlacesVisit"` \| `"PlacesVisitRemoved"` \| `"PlacesVisitTitle"` \| `"PlacesWeakCallbackWrapper"` \| `"PluginCrashedEvent"` \| `"PopupBlockedEvent"` \| `"PopupPositionedEvent"` \| `"PositionStateEvent"` \| `"PrecompiledScript"` \| `"PrivateAttribution"` \| `"ProcessMessageManager"` \| `"PushManagerImpl"` \| `"RTCPeerConnectionStatic"` \| `"Sanitizer"` \| `"Scheduler"` \| `"ScreenLuminance"` \| `"ScrollAreaEvent"` \| `"SessionStoreFormData"` \| `"SessionStoreScrollData"` \| `"SimpleGestureEvent"` \| `"SpeechGrammar"` \| `"SpeechGrammarList"` \| `"SpeechRecognition"` \| `"SpeechRecognitionError"` \| `"SpeechRecognitionEvent"` \| `"StreamFilter"` \| `"StreamFilterDataEvent"` \| `"StructuredCloneHolder"` \| `"StructuredCloneTester"` \| `"StyleSheetApplicableStateChangeEvent"` \| `"StyleSheetRemovedEvent"` \| `"SyncMessageSender"` \| `"TCPServerSocket"` \| `"TCPServerSocketEvent"` \| `"TCPSocket"` \| `"TCPSocketErrorEvent"` \| `"TCPSocketEvent"` \| `"TaskController"` \| `"TaskPriorityChangeEvent"` \| `"TaskSignal"` \| `"TestFunctions"` \| `"TestInterfaceAsyncIterableDouble"` \| `"TestInterfaceAsyncIterableDoubleUnion"` \| `"TestInterfaceAsyncIterableSingle"` \| `"TestInterfaceAsyncIterableSingleWithArgs"` \| `"TestInterfaceIterableDouble"` \| `"TestInterfaceIterableDoubleUnion"` \| `"TestInterfaceIterableSingle"` \| `"TestInterfaceJS"` \| `"TestInterfaceLength"` \| `"TestInterfaceMaplike"` \| `"TestInterfaceMaplikeJSObject"` \| `"TestInterfaceMaplikeObject"` \| `"TestInterfaceObservableArray"` \| `"TestInterfaceSetlike"` \| `"TestInterfaceSetlikeNode"` \| `"TestReflectedHTMLAttribute"` \| `"TestTrialInterface"` \| `"TestingDeprecatedInterface"` \| `"TextClause"` \| `"TimeEvent"` \| `"TreeColumn"` \| `"TreeColumns"` \| `"TreeContentView"` \| `"TrustedScript"` \| `"TrustedScriptURL"` \| `"TrustedTypePolicy"` \| `"TrustedTypePolicyFactory"` \| `"UDPMessageEvent"` \| `"UDPSocket"` \| `"UniFFIPointer"` \| `"UserProximityEvent"` \| `"VRDisplay"` \| `"VRDisplayCapabilities"` \| `"VRDisplayEvent"` \| `"VREyeParameters"` \| `"VRFieldOfView"` \| `"VRFrameData"` \| `"VRMockController"` \| `"VRMockDisplay"` \| `"VRPose"` \| `"VRServiceTest"` \| `"VRStageParameters"` \| `"VideoTrack"` \| `"VideoTrackList"` \| `"WGSLLanguageFeatures"` \| `"WebExtensionContentScript"` \| `"WebExtensionPolicy"` \| `"WebTransportReceiveStream"` \| `"WebTransportSendStream"` \| `"WindowContext"` \| `"WindowGlobalChild"` \| `"WindowGlobalParent"` \| `"WindowRoot"` \| `"WrapperCachedNonISupportsTestInterface"` \| `"XRBoundedReferenceSpace"` \| `"XRFrame"` \| `"XRInputSource"` \| `"XRInputSourceArray"` \| `"XRInputSourceEvent"` \| `"XRInputSourcesChangeEvent"` \| `"XRPose"` \| `"XRReferenceSpace"` \| `"XRReferenceSpaceEvent"` \| `"XRRenderState"` \| `"XRRigidTransform"` \| `"XRSession"` \| `"XRSessionEvent"` \| `"XRSpace"` \| `"XRSystem"` \| `"XRView"` \| `"XRViewerPose"` \| `"XRViewport"` \| `"XRWebGLLayer"` \| `"XULCommandEvent"` \| `"XULElement"` \| `"XULFrameElement"` \| `"XULMenuElement"` \| `"XULPopupElement"` \| `"XULResizerElement"` \| `"XULTextElement"` \| `"XULTreeElement"` \| `"AddonManagerPermissions"` \| `"ChromeUtils"` \| `"FuzzingFunctions"` \| `"IOUtils"` \| `"InspectorUtils"` \| `"L10nOverlays"` \| `"MediaControlService"` \| `"Nyx"` \| `"PathUtils"` \| `"PlacesObservers"` \| `"PromiseDebugging"` \| `"SessionStoreUtils"` \| `"TestUtils"` \| `"UniFFIScaffolding"` \| `"UserInteraction"` \| `"WebrtcGlobalInformation"` \| `"webkitSpeechGrammar"` \| `"webkitSpeechGrammarList"` \| `"webkitSpeechRecognition"` \| `"_ZoteroTypes"` \| `"ePub"` \| `"Buffer"` \| `"global"` \| `"process"` \| `"gc"` \| `"__dirname"` \| `"__filename"` \| `"exports"` \| `"module"` \| `"require"` \| `"setImmediate"` \| `"clearImmediate"` \| `"URLPattern"`

###### GLOBAL

`GLOBAL` *extends* *typeof* `globalThis`

##### Parameters

###### k

`K`

##### Returns

`GLOBAL`\[`K`\]

##### Inherited from

[`BasicTool`](Class.BasicTool.md).[`getGlobal`](./Class.BasicTool.html#getglobal)

#### Call Signature

ts

```
getGlobal(k): any;
```

Defined in: [src/basic.ts:156](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L156)

Get global variables.

##### Parameters

###### k

`string`

Global variable name, `Zotero`, `ZoteroPane`, `window`, `document`, etc.

##### Returns

`any`

##### Inherited from

[`BasicTool`](Class.BasicTool.md).[`getGlobal`](./Class.BasicTool.html#getglobal)

---

### getKeys()

ts

```
getKeys(): string[];
```

Defined in: [src/helpers/largePref.ts:113](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/helpers/largePref.ts#L113)

Get the keys of the data.

#### Returns

`string`\[\]

The keys of the data.

---

### getValue()

ts

```
getValue(key): any;
```

Defined in: [src/helpers/largePref.ts:141](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/helpers/largePref.ts#L141)

Get the value of a key.

#### Parameters

##### key

`string`

The key of the data.

#### Returns

`any`

The value of the key.

---

### hasKey()

ts

```
hasKey(key): boolean;
```

Defined in: [src/helpers/largePref.ts:173](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/helpers/largePref.ts#L173)

Check if a key exists.

#### Parameters

##### key

`string`

The key of the data.

#### Returns

`boolean`

Whether the key exists.

---

### isXULElement()

ts

```
isXULElement(elem): boolean;
```

Defined in: [src/basic.ts:189](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L189)

If it's an XUL element

#### Parameters

##### elem

`Element`

#### Returns

`boolean`

#### Inherited from

[`BasicTool`](Class.BasicTool.md).[`isXULElement`](./Class.BasicTool.html#isxulelement)

---

### log()

ts

```
log(...data): void;
```

Defined in: [src/basic.ts:221](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L221)

Output to both Zotero.debug and console.log

#### Parameters

##### data

...`any`

e.g. string, number, object, ...

#### Returns

`void`

#### Inherited from

[`BasicTool`](Class.BasicTool.md).[`log`](./Class.BasicTool.html#log)

---

### ~~patch()~~

ts

```
patch<T, K>(
   object,
   funcSign,
   ownerSign,
   patcher): void;
```

Defined in: [src/basic.ts:300](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L300)

Patch a function

#### Type Parameters

##### T

`T`

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### object

`T`

The owner of the function

##### funcSign

`K`

The signature of the function(function name)

##### ownerSign

`string`

The signature of patch owner to avoid patching again

##### patcher

(`fn`) => `T`\[`K`\]

The new wrapper of the patched function

#### Returns

`void`

#### Deprecated

Use [PatchHelper](Class.PatchHelper.md) instead.

#### Inherited from

[`BasicTool`](Class.BasicTool.md).[`patch`](./Class.BasicTool.html#patch)

---

### removeListenerCallback()

ts

```
removeListenerCallback<T>(type, callback): void;
```

Defined in: [src/basic.ts:337](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L337)

Remove a Zotero event listener callback

#### Type Parameters

##### T

`T` *extends* keyof `ListenerCallbackMap`

#### Parameters

##### type

`T`

Event type

##### callback

`ListenerCallbackMap`\[`T`\]

Event callback

#### Returns

`void`

#### Inherited from

[`BasicTool`](Class.BasicTool.md).[`removeListenerCallback`](./Class.BasicTool.html#removelistenercallback)

---

### setKey()

ts

```
setKey(key): void;
```

Defined in: [src/helpers/largePref.ts:181](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/helpers/largePref.ts#L181)

Add a key.

#### Parameters

##### key

`string`

The key of the data.

#### Returns

`void`

---

### setKeys()

ts

```
setKeys(keys): void;
```

Defined in: [src/helpers/largePref.ts:127](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/helpers/largePref.ts#L127)

Set the keys of the data.

#### Parameters

##### keys

`string`\[\]

The keys of the data.

#### Returns

`void`

---

### setValue()

ts

```
setValue(key, value): void;
```

Defined in: [src/helpers/largePref.ts:158](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/helpers/largePref.ts#L158)

Set the value of a key.

#### Parameters

##### key

`string`

The key of the data.

##### value

`any`

The value of the key.

#### Returns

`void`

---

### updateOptions()

ts

```
updateOptions(source?): LargePrefHelper;
```

Defined in: [src/basic.ts:442](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L442)

#### Parameters

##### source?

[`BasicTool`](Class.BasicTool.md) \| [`BasicOptions`](Interface.BasicOptions.md)

#### Returns

`LargePrefHelper`

#### Inherited from

[`BasicTool`](Class.BasicTool.md).[`updateOptions`](./Class.BasicTool.html#updateoptions)

---

### getZotero()

ts

```
static getZotero(): typeof Zotero;
```

Defined in: [src/basic.ts:454](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L454)

#### Returns

*typeof* `Zotero`

#### Inherited from

[`BasicTool`](Class.BasicTool.md).[`getZotero`](./Class.BasicTool.html#getzotero)
