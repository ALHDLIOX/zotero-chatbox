# Class: SettingsDialogHelper

Defined in: [src/helpers/settingsDialog.ts:7](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/settingsDialog.ts#L7)

Settings dialog helper. Extends DialogHelper with setting management capabilities.

## Extends

- [`DialogHelper`](Class.DialogHelper.md)

## Constructors

### Constructor

ts

```
new SettingsDialogHelper(): SettingsDialogHelper;
```

Defined in: [src/helpers/settingsDialog.ts:23](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/settingsDialog.ts#L23)

Create a settings dialog helper. Uses a 2-column grid layout by default (label column + control column)

#### Returns

`SettingsDialogHelper`

#### Overrides

[`DialogHelper`](Class.DialogHelper.md).[`constructor`](./Class.DialogHelper.md#constructor)

## Properties

### \_basicOptions

ts

```
protected _basicOptions: UIOptions;
```

Defined in: [src/tools/ui.ts:11](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L11)

UITool options

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`_basicOptions`](./Class.DialogHelper.md#basicoptions)

---

### \_console?

ts

```
protected optional _console: Console;
```

Defined in: [src/basic.ts:16](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L16)

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`_console`](./Class.DialogHelper.md#console)

---

### dialogData

ts

```
dialogData: DialogData;
```

Defined in: [src/helpers/dialog.ts:11](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/dialog.ts#L11)

Passed to dialog window for data-binding and lifecycle controls. See [DialogHelper.setDialogData](./Class.DialogHelper.md#setdialogdata)

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`dialogData`](./Class.DialogHelper.md#dialogdata)

---

### elementCache

ts

```
protected elementCache: WeakRef<Element>[];
```

Defined in: [src/tools/ui.ts:26](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L26)

Store elements created with this instance

#### Remarks

> What is this for?

In bootstrap plugins, elements must be manually maintained and removed on exiting.

This API does this for you.

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`elementCache`](./Class.DialogHelper.md#elementcache)

---

### elementProps

ts

```
protected elementProps: ElementProps & object;
```

Defined in: [src/helpers/dialog.ts:16](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/dialog.ts#L16)

#### Type declaration

##### tag

ts

```
tag: string;
```

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`elementProps`](./Class.DialogHelper.md#elementprops)

---

### ~~patchSign~~

ts

```
protected readonly patchSign: string = "zotero-plugin-toolkit@3.0.0";
```

Defined in: [src/basic.ts:21](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L21)

#### Deprecated

Use `patcherManager` instead.

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`patchSign`](./Class.DialogHelper.md#patchsign)

---

### window

ts

```
window: Window;
```

Defined in: [src/helpers/dialog.ts:15](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/dialog.ts#L15)

Dialog window instance

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`window`](./Class.DialogHelper.md#window)

---

### \_version

ts

```
static _version: string = version;
```

Defined in: [src/basic.ts:23](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L23)

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`_version`](./Class.DialogHelper.md#version)

## Accessors

### \_version

#### Get Signature

ts

```
get _version(): string;
```

Defined in: [src/basic.ts:28](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L28)

Get version - checks subclass first, then falls back to parent

##### Returns

`string`

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`_version`](./Class.DialogHelper.md#version-1)

---

### basicOptions

#### Get Signature

ts

```
get basicOptions(): UIOptions;
```

Defined in: [src/tools/ui.ts:13](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L13)

##### Returns

[`UIOptions`](Interface.UIOptions.md)

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`basicOptions`](./Class.DialogHelper.md#basicoptions)

## Methods

### \_ensureMainWindowListener()

ts

```
protected _ensureMainWindowListener(): void;
```

Defined in: [src/basic.ts:368](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L368)

Ensure the main window listener is registered.

#### Returns

`void`

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`_ensureMainWindowListener`](./Class.DialogHelper.md#ensuremainwindowlistener)

---

### \_ensurePluginListener()

ts

```
protected _ensurePluginListener(): void;
```

Defined in: [src/basic.ts:418](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L418)

Ensure the plugin listener is registered.

#### Returns

`void`

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`_ensurePluginListener`](./Class.DialogHelper.md#ensurepluginlistener)

---

### \_ensureRemoveListener()

ts

```
protected _ensureRemoveListener(): void;
```

Defined in: [src/basic.ts:349](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L349)

Remove all Zotero event listener callbacks when the last callback is removed.

#### Returns

`void`

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`_ensureRemoveListener`](./Class.DialogHelper.md#ensureremovelistener)

---

### addAutoSaveButton()

ts

```
addAutoSaveButton(
   label,
   id?,
   options?): SettingsDialogHelper;
```

Defined in: [src/helpers/settingsDialog.ts:217](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/settingsDialog.ts#L217)

Add a control button that will auto-save settings when clicked.

#### Parameters

##### label

`string`

Button label

##### id?

`string`

Button id

##### options?

Button options

###### callback?

(`ev`) => `any`

Callback of button click event

###### noClose?

`boolean`

Don't close window when clicking this button

###### validate?

(`data`) => `string` \| `true` \| `Promise`\<`string` \| `true`\>

Validation function for settings data

#### Returns

`SettingsDialogHelper`

---

### addButton()

ts

```
addButton(
   label,
   id?,
   options?): SettingsDialogHelper;
```

Defined in: [src/helpers/dialog.ts:98](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/dialog.ts#L98)

Add a control button to the bottom of the dialog.

#### Parameters

##### label

`string`

Button label

##### id?

`string`

Button id. The corresponding id of the last button user clicks before window exit will be set to `dialogData._lastButtonId`.

##### options?

Options

###### callback?

(`ev`) => `any`

Callback of button click event.

###### noClose?

`boolean`

Don't close window when clicking this button.

#### Returns

`SettingsDialogHelper`

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`addButton`](./Class.DialogHelper.md#addbutton)

---

### addCell()

ts

```
addCell(
   row,
   column,
   elementProps,
   cellFlex): SettingsDialogHelper;
```

Defined in: [src/helpers/dialog.ts:65](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/dialog.ts#L65)

Add a cell at (row, column). Index starts from 0.

#### Parameters

##### row

`number`

##### column

`number`

##### elementProps

[`TagElementProps`](Interface.TagElementProps.md)

Cell element props. See [ElementProps](Interface.ElementProps.md)

##### cellFlex

`boolean` = `true`

If the cell is flex. Default true.

#### Returns

`SettingsDialogHelper`

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`addCell`](./Class.DialogHelper.md#addcell)

---

### addListenerCallback()

ts

```
addListenerCallback<T>(type, callback): void;
```

Defined in: [src/basic.ts:319](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L319)

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

[`DialogHelper`](Class.DialogHelper.md).[`addListenerCallback`](./Class.DialogHelper.md#addlistenercallback)

---

### addSetting()

ts

```
addSetting(
   label,
   settingKey,
   controlProps,
   options): SettingsDialogHelper;
```

Defined in: [src/helpers/settingsDialog.ts:85](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/settingsDialog.ts#L85)

Add a setting row with label and form control.

#### Parameters

##### label

`string`

Label text for the setting

##### settingKey

`string`

The key used to store/retrieve the setting

##### controlProps

[`TagElementProps`](Interface.TagElementProps.md)

Properties for the form control element

##### options

Additional options

###### condition?

() => `boolean`

Optional condition function to determine if the setting should be added (returns true to add, false to skip)

###### labelProps?

`Partial`\<[`TagElementProps`](Interface.TagElementProps.md)\>

Properties for the label element

###### valueType?

`"string"` \| `"number"` \| `"boolean"`

Type of the setting value for proper conversion

#### Returns

`SettingsDialogHelper`

The SettingsDialogHelper instance for chaining

---

### addStaticRow()

ts

```
addStaticRow(
   label,
   staticElementProps,
   options): SettingsDialogHelper;
```

Defined in: [src/helpers/settingsDialog.ts:162](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/settingsDialog.ts#L162)

Add a static row (label + static element) to the settings grid. This is not a form control.

#### Parameters

##### label

`string`

Label text for the row

##### staticElementProps

[`TagElementProps`](Interface.TagElementProps.md)

Properties for the static element (e.g., text, icon, etc.)

##### options

Additional options

###### condition?

() => `boolean`

Optional condition function to determine if the row should be added

###### labelProps?

`Partial`\<[`TagElementProps`](Interface.TagElementProps.md)\>

Properties for the label element

#### Returns

`SettingsDialogHelper`

The SettingsDialogHelper instance for chaining

---

### appendElement()

ts

```
appendElement(properties, container): Node;
```

Defined in: [src/tools/ui.ts:322](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L322)

Append element(s) to a node.

#### Parameters

##### properties

[`TagElementProps`](Interface.TagElementProps.md)

See [ElementProps](Interface.ElementProps.md)

##### container

`Element`

The parent node to append to.

#### Returns

`Node`

A Node that is the appended child (aChild), except when aChild is a DocumentFragment, in which case the empty DocumentFragment is returned.

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`appendElement`](./Class.DialogHelper.md#appendelement)

---

### createElement()

#### Call Signature

ts

```
createElement(
   doc,
   tagName,
   props?): DocumentFragment;
```

Defined in: [src/tools/ui.ts:78](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L78)

Create `DocumentFragment`.

##### Parameters

###### doc

`Document`

###### tagName

`"fragment"`

###### props?

[`FragmentElementProps`](Interface.FragmentElementProps.md)

##### Returns

`DocumentFragment`

##### Example

ts

```
const frag: DocumentFragment = ui.createElement(document, "fragment", {
  children: [{ tag: "h1", properties: { innerText: "Hello World!" } }],
});
```

##### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`createElement`](./Class.DialogHelper.md#createelement)

#### Call Signature

ts

```
createElement<HTML_TAG, T>(
   doc,
   tagName,
   props?): T;
```

Defined in: [src/tools/ui.ts:113](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L113)

Create `HTMLElement`.

##### Type Parameters

###### HTML_TAG

`HTML_TAG` *extends* keyof `HTMLElementTagNameMap`

###### T

`T` *extends* \| `HTMLElement` \| `HTMLSlotElement` \| `HTMLObjectElement` \| `HTMLHtmlElement` \| `HTMLAnchorElement` \| `HTMLAreaElement` \| `HTMLAudioElement` \| `HTMLBaseElement` \| `HTMLQuoteElement` \| `HTMLBodyElement` \| `HTMLBRElement` \| `HTMLButtonElement` \| `HTMLCanvasElement` \| `HTMLTableCaptionElement` \| `HTMLTableColElement` \| `HTMLDataElement` \| `HTMLDataListElement` \| `HTMLModElement` \| `HTMLDetailsElement` \| `HTMLDialogElement` \| `HTMLDivElement` \| `HTMLDListElement` \| `HTMLEmbedElement` \| `HTMLFieldSetElement` \| `HTMLFormElement` \| `HTMLHeadingElement` \| `HTMLHeadElement` \| `HTMLHRElement` \| `HTMLIFrameElement` \| `HTMLImageElement` \| `HTMLInputElement` \| `HTMLLabelElement` \| `HTMLLegendElement` \| `HTMLLIElement` \| `HTMLLinkElement` \| `HTMLMapElement` \| `HTMLMenuElement` \| `HTMLMetaElement` \| `HTMLMeterElement` \| `HTMLOListElement` \| `HTMLOptGroupElement` \| `HTMLOptionElement` \| `HTMLOutputElement` \| `HTMLParagraphElement` \| `HTMLPictureElement` \| `HTMLPreElement` \| `HTMLProgressElement` \| `HTMLScriptElement` \| `HTMLSelectElement` \| `HTMLSourceElement` \| `HTMLSpanElement` \| `HTMLStyleElement` \| `HTMLTableElement` \| `HTMLTableSectionElement` \| `HTMLTableCellElement` \| `HTMLTemplateElement` \| `HTMLTextAreaElement` \| `HTMLTimeElement` \| `HTMLTitleElement` \| `HTMLTableRowElement` \| `HTMLTrackElement` \| `HTMLUListElement` \| `HTMLVideoElement` \| `HTMLUnknownElement` \| `HTMLDirectoryElement` \| `HTMLFontElement` \| `HTMLFrameElement` \| `HTMLFrameSetElement` \| `HTMLMarqueeElement` \| `HTMLParamElement`

##### Parameters

###### doc

`Document`

###### tagName

`HTML_TAG`

###### props?

[`HTMLElementProps`](Interface.HTMLElementProps.md)

See [ElementProps](Interface.ElementProps.md)

##### Returns

`T`

##### Examples

ts

```
const div: HTMLDivElement = ui.createElement(document, "div");
```

Attributes(for `elem.setAttribute()`), properties(for `elem.prop=`), listeners, and children.

ts

```
const div: HTMLDivElement = ui.createElement(document, "div", {
  id: "hi-div",
  skipIfExists: true,
  listeners: [{ type: "click", listener: (e) => ui.log("Clicked!") }],
  children: [
    { tag: "h1", properties: { innerText: "Hello World!" } },
    { tag: "a", attributes: { href: "https://www.zotero.org" } },
  ],
});
```

##### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`createElement`](./Class.DialogHelper.md#createelement)

#### Call Signature

ts

```
createElement<XUL_TAG, T>(
   doc,
   tagName,
   props?): T;
```

Defined in: [src/tools/ui.ts:128](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L128)

Create `XULElement`.

##### Type Parameters

###### XUL_TAG

`XUL_TAG` *extends* keyof `XULElementTagNameMap`

###### T

`T` *extends* \| `XULElement` \| `XULButtonElement` \| `XULLabelElement` \| `XULMenuElement` \| `XULBoxElement` \| `XULBrowserElement` \| `XULCheckboxElement` \| `XULColorPickerElement` \| `XULCommandElement` \| `XULDeckElement` \| `XULDescriptionElement` \| `XULGrippyElement` \| `XULGroupBoxElement` \| `XULListItemElement` \| `XULMenuBarElement` \| `XULMenuItemElement` \| `XULMenuListElement` \| `XULMenuPopupElement` \| `XULPopupElement` \| `XULMenuSeparatorElement` \| `XULProgressMeterElement` \| `XULRadioElement` \| `XULRadioGroupElement` \| `XULScrollBarElement` \| `XULSeparatorElement` \| `XULSpacerElement` \| `XULSplitterElement` \| `XULStatusBarElement` \| `XULStatusBarPanelElement` \| `XULTabElement` \| `XULTabBoxElement` \| `XULTabPanelElement` \| `XULTabPanelsElement` \| `XULTabsElement` \| `XULTextBoxElement` \| `XULToolBarElement` \| `XULToolBarButtonElement` \| `XULToolBarGrippyElement` \| `XULToolBarItemElement` \| `XULToolBarPaletteElement` \| `XULToolBarSeparatorElement` \| `XULToolBarSetElement` \| `XULToolBarSpacerElement` \| `XULToolBarSpringElement` \| `XULToolBoxElement` \| `XULTooltipElement` \| `XULTreeElement` \| `XULTreeCellElement` \| `XULTreeChildrenElement` \| `XULTreeColElement` \| `XULTreeColsElement` \| `XULTreeItemElement` \| `XULTreeRowElement` \| `XULTreeSeparatorElement` \| `XULWindowElement`

##### Parameters

###### doc

`Document`

###### tagName

`XUL_TAG`

###### props?

[`XULElementProps`](Interface.XULElementProps.md)

See [ElementProps](Interface.ElementProps.md)

##### Returns

`T`

##### See

ElementProps

##### Example

ts

```
const menuitem: XULMenuItem = ui.createElement(document, "menuitem", {
  attributes: { label: "Click Me!" },
});
```

##### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`createElement`](./Class.DialogHelper.md#createelement)

#### Call Signature

ts

```
createElement<SVG_TAG, T>(
   doc,
   tagName,
   props?): T;
```

Defined in: [src/tools/ui.ts:138](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L138)

Create `SVGElement`

##### Type Parameters

###### SVG_TAG

`SVG_TAG` *extends* keyof `SVGElementTagNameMap`

###### T

`T` *extends* \| `SVGSVGElement` \| `SVGSymbolElement` \| `SVGAElement` \| `SVGScriptElement` \| `SVGStyleElement` \| `SVGTitleElement` \| `SVGImageElement` \| `SVGAnimateElement` \| `SVGAnimateMotionElement` \| `SVGAnimateTransformElement` \| `SVGCircleElement` \| `SVGClipPathElement` \| `SVGDefsElement` \| `SVGDescElement` \| `SVGEllipseElement` \| `SVGFEBlendElement` \| `SVGFEColorMatrixElement` \| `SVGFEComponentTransferElement` \| `SVGFECompositeElement` \| `SVGFEConvolveMatrixElement` \| `SVGFEDiffuseLightingElement` \| `SVGFEDisplacementMapElement` \| `SVGFEDistantLightElement` \| `SVGFEDropShadowElement` \| `SVGFEFloodElement` \| `SVGFEFuncAElement` \| `SVGFEFuncBElement` \| `SVGFEFuncGElement` \| `SVGFEFuncRElement` \| `SVGFEGaussianBlurElement` \| `SVGFEImageElement` \| `SVGFEMergeElement` \| `SVGFEMergeNodeElement` \| `SVGFEMorphologyElement` \| `SVGFEOffsetElement` \| `SVGFEPointLightElement` \| `SVGFESpecularLightingElement` \| `SVGFESpotLightElement` \| `SVGFETileElement` \| `SVGFETurbulenceElement` \| `SVGFilterElement` \| `SVGForeignObjectElement` \| `SVGGElement` \| `SVGLineElement` \| `SVGLinearGradientElement` \| `SVGMarkerElement` \| `SVGMaskElement` \| `SVGMetadataElement` \| `SVGMPathElement` \| `SVGPathElement` \| `SVGPatternElement` \| `SVGPolygonElement` \| `SVGPolylineElement` \| `SVGRadialGradientElement` \| `SVGRectElement` \| `SVGSetElement` \| `SVGStopElement` \| `SVGSwitchElement` \| `SVGTextElement` \| `SVGTextPathElement` \| `SVGTSpanElement` \| `SVGUseElement` \| `SVGViewElement`

##### Parameters

###### doc

`Document`

###### tagName

`SVG_TAG`

###### props?

`SVGElementProps`

See [ElementProps](Interface.ElementProps.md)

##### Returns

`T`

##### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`createElement`](./Class.DialogHelper.md#createelement)

#### Call Signature

ts

```
createElement(
   doc,
   tagName,
   props?): HTMLElement | SVGElement | XULElement;
```

Defined in: [src/tools/ui.ts:148](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L148)

Create Element

##### Parameters

###### doc

`Document`

###### tagName

`string`

###### props?

[`ElementProps`](Interface.ElementProps.md)

See [ElementProps](Interface.ElementProps.md)

##### Returns

`HTMLElement` \| `SVGElement` \| `XULElement`

##### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`createElement`](./Class.DialogHelper.md#createelement)

#### Call Signature

ts

```
createElement(
   doc,
   tagName,
   namespace?,
   enableElementRecord?): DocumentFragment | HTMLElement | SVGElement | XULElement;
```

Defined in: [src/tools/ui.ts:160](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L160)

##### Parameters

###### doc

`Document`

target document, e.g. Zotero main window.document

###### tagName

`string`

element tag name, e.g. `hbox`, `div`

###### namespace?

default "html"

`"html"` \| `"svg"` \| `"xul"`

###### enableElementRecord?

`boolean`

If current element will be recorded and maintained by toolkit. If not set, use this.enableElementRecordGlobal

##### Returns

`DocumentFragment` \| `HTMLElement` \| `SVGElement` \| `XULElement`

##### Deprecated

##### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`createElement`](./Class.DialogHelper.md#createelement)

---

### createXULElement()

ts

```
createXULElement(doc, type): XULElement;
```

Defined in: [src/basic.ts:212](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L212)

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

[`DialogHelper`](Class.DialogHelper.md).[`createXULElement`](./Class.DialogHelper.md#createxulelement)

---

### getAllSettingsData()

ts

```
getAllSettingsData(): Record<string, any>;
```

Defined in: [src/helpers/settingsDialog.ts:276](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/settingsDialog.ts#L276)

Collect and return all current setting values from the dialog controls.

#### Returns

`Record`\<`string`, `any`\>

---

### getGlobal()

#### Call Signature

ts

```
getGlobal(k): typeof Zotero;
```

Defined in: [src/basic.ts:93](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L93)

**`Alpha`**

##### Parameters

###### k

`"Zotero"` \| `"zotero"`

##### Returns

*typeof* `Zotero`

##### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`getGlobal`](./Class.DialogHelper.md#getglobal)

#### Call Signature

ts

```
getGlobal(k): ZoteroPane;
```

Defined in: [src/basic.ts:98](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L98)

**`Alpha`**

##### Parameters

###### k

`"ZoteroPane"` \| `"ZoteroPane_Local"`

##### Returns

`ZoteroPane`

##### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`getGlobal`](./Class.DialogHelper.md#getglobal)

#### Call Signature

ts

```
getGlobal(k): Zotero_Tabs;
```

Defined in: [src/basic.ts:103](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L103)

**`Alpha`**

##### Parameters

###### k

`"Zotero_Tabs"`

##### Returns

`Zotero_Tabs`

##### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`getGlobal`](./Class.DialogHelper.md#getglobal)

#### Call Signature

ts

```
getGlobal(k): any;
```

Defined in: [src/basic.ts:108](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L108)

**`Alpha`**

##### Parameters

###### k

`"Zotero_File_Interface"`

##### Returns

`any`

##### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`getGlobal`](./Class.DialogHelper.md#getglobal)

#### Call Signature

ts

```
getGlobal(k): any;
```

Defined in: [src/basic.ts:113](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L113)

**`Alpha`**

##### Parameters

###### k

`"Zotero_File_Exporter"`

##### Returns

`any`

##### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`getGlobal`](./Class.DialogHelper.md#getglobal)

#### Call Signature

ts

```
getGlobal(k): any;
```

Defined in: [src/basic.ts:118](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L118)

**`Alpha`**

##### Parameters

###### k

`"Zotero_LocateMenu"`

##### Returns

`any`

##### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`getGlobal`](./Class.DialogHelper.md#getglobal)

#### Call Signature

ts

```
getGlobal(k): any;
```

Defined in: [src/basic.ts:123](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L123)

**`Alpha`**

##### Parameters

###### k

`"Zotero_Report_Interface"`

##### Returns

`any`

##### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`getGlobal`](./Class.DialogHelper.md#getglobal)

#### Call Signature

ts

```
getGlobal(k): any;
```

Defined in: [src/basic.ts:128](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L128)

**`Alpha`**

##### Parameters

###### k

`"Zotero_Timeline_Interface"`

##### Returns

`any`

##### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`getGlobal`](./Class.DialogHelper.md#getglobal)

#### Call Signature

ts

```
getGlobal(k): any;
```

Defined in: [src/basic.ts:133](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L133)

**`Alpha`**

##### Parameters

###### k

`"Zotero_Tooltip"`

##### Returns

`any`

##### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`getGlobal`](./Class.DialogHelper.md#getglobal)

#### Call Signature

ts

```
getGlobal(k): ZoteroContextPane;
```

Defined in: [src/basic.ts:138](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L138)

**`Alpha`**

##### Parameters

###### k

`"ZoteroContextPane"`

##### Returns

`ZoteroContextPane`

##### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`getGlobal`](./Class.DialogHelper.md#getglobal)

#### Call Signature

ts

```
getGlobal(k): any;
```

Defined in: [src/basic.ts:143](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L143)

**`Alpha`**

##### Parameters

###### k

`"ZoteroItemPane"`

##### Returns

`any`

##### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`getGlobal`](./Class.DialogHelper.md#getglobal)

#### Call Signature

ts

```
getGlobal<K, GLOBAL>(k): GLOBAL[K];
```

Defined in: [src/basic.ts:148](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L148)

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

[`DialogHelper`](Class.DialogHelper.md).[`getGlobal`](./Class.DialogHelper.md#getglobal)

#### Call Signature

ts

```
getGlobal(k): any;
```

Defined in: [src/basic.ts:156](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L156)

Get global variables.

##### Parameters

###### k

`string`

Global variable name, `Zotero`, `ZoteroPane`, `window`, `document`, etc.

##### Returns

`any`

##### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`getGlobal`](./Class.DialogHelper.md#getglobal)

---

### insertElementBefore()

ts

```
insertElementBefore(properties, referenceNode): undefined | Node;
```

Defined in: [src/tools/ui.ts:334](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L334)

Inserts a node before a reference node as a child of its parent node.

#### Parameters

##### properties

[`TagElementProps`](Interface.TagElementProps.md)

See [ElementProps](Interface.ElementProps.md)

##### referenceNode

`Element`

The node before which newNode is inserted.

#### Returns

`undefined` \| `Node`

Node

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`insertElementBefore`](./Class.DialogHelper.md#insertelementbefore)

---

### isXULElement()

ts

```
isXULElement(elem): boolean;
```

Defined in: [src/basic.ts:189](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L189)

If it's an XUL element

#### Parameters

##### elem

`Element`

#### Returns

`boolean`

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`isXULElement`](./Class.DialogHelper.md#isxulelement)

---

### loadAllSettings()

ts

```
loadAllSettings(): void;
```

Defined in: [src/helpers/settingsDialog.ts:298](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/settingsDialog.ts#L298)

Load all settings from the setting handlers.

#### Returns

`void`

---

### log()

ts

```
log(...data): void;
```

Defined in: [src/basic.ts:221](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L221)

Output to both Zotero.debug and console.log

#### Parameters

##### data

...`any`

e.g. string, number, object, ...

#### Returns

`void`

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`log`](./Class.DialogHelper.md#log)

---

### open()

ts

```
open(title, windowFeatures): SettingsDialogHelper;
```

Defined in: [src/helpers/settingsDialog.ts:322](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/settingsDialog.ts#L322)

Override the open method to handle setting loading after window opens.

#### Parameters

##### title

`string`

##### windowFeatures

###### alwaysRaised?

`boolean`

###### centerscreen?

`boolean`

###### fitContent?

`boolean`

###### height?

`number`

###### left?

`number`

###### noDialogMode?

`boolean`

###### resizable?

`boolean`

###### top?

`number`

###### width?

`number`

#### Returns

`SettingsDialogHelper`

#### Overrides

[`DialogHelper`](Class.DialogHelper.md).[`open`](./Class.DialogHelper.md#open)

---

### parseXHTMLToFragment()

ts

```
parseXHTMLToFragment(
   str,
   entities,
   defaultXUL): DocumentFragment;
```

Defined in: [src/tools/ui.ts:380](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L380)

Parse XHTML to XUL fragment. For Zotero 6.

To load preferences from a Zotero 7's `.xhtml`, use this method to parse it.

#### Parameters

##### str

`string`

xhtml raw text

##### entities

`string`\[\] = `[]`

dtd file list ("chrome://xxx.dtd")

##### defaultXUL

`boolean` = `true`

true for default XUL namespace

#### Returns

`DocumentFragment`

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`parseXHTMLToFragment`](./Class.DialogHelper.md#parsexhtmltofragment)

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

Defined in: [src/basic.ts:300](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L300)

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

[`DialogHelper`](Class.DialogHelper.md).[`patch`](./Class.DialogHelper.md#patch)

---

### removeListenerCallback()

ts

```
removeListenerCallback<T>(type, callback): void;
```

Defined in: [src/basic.ts:337](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L337)

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

[`DialogHelper`](Class.DialogHelper.md).[`removeListenerCallback`](./Class.DialogHelper.md#removelistenercallback)

---

### replaceElement()

ts

```
replaceElement(properties, oldNode): undefined | Node;
```

Defined in: [src/tools/ui.ts:358](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L358)

Replace oldNode with a new one.

#### Parameters

##### properties

[`ElementProps`](Interface.ElementProps.md) & `object`

See [ElementProps](Interface.ElementProps.md)

##### oldNode

`Element`

The child to be replaced.

#### Returns

`undefined` \| `Node`

The replaced Node. This is the same node as oldChild.

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`replaceElement`](./Class.DialogHelper.md#replaceelement)

---

### saveAllSettings()

ts

```
saveAllSettings(): void;
```

Defined in: [src/helpers/settingsDialog.ts:258](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/settingsDialog.ts#L258)

Save all settings using the setting handlers.

#### Returns

`void`

---

### setDialogData()

ts

```
setDialogData(dialogData): SettingsDialogHelper;
```

Defined in: [src/helpers/dialog.ts:166](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/dialog.ts#L166)

Dialog data.

#### Parameters

##### dialogData

[`DialogData`](Interface.DialogData.md)

#### Returns

`SettingsDialogHelper`

#### Remarks

This object is passed to the dialog window.

The control button id is in `dialogData._lastButtonId`;

The data-binding values are in `dialogData`.

ts

```
interface DialogData {
  [key: string | number | symbol]: any;
  loadLock?: {
    promise: Promise<void>;
    resolve: () => void;
    isResolved: () => boolean;
  }; // resolve after window load (auto-generated)
  loadCallback?: Function; // called after window load
  unloadLock?: { promise: Promise<void>; resolve: () => void }; // resolve after window unload (auto-generated)
  unloadCallback?: Function; // called after window unload
  beforeUnloadCallback?: Function; // called before window unload when elements are accessable.
}
```

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`setDialogData`](./Class.DialogHelper.md#setdialogdata)

---

### setSettingHandlers()

ts

```
setSettingHandlers(getSetting, setSetting): SettingsDialogHelper;
```

Defined in: [src/helpers/settingsDialog.ts:65](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/settingsDialog.ts#L65)

Set the setting handlers for getting and setting values.

#### Parameters

##### getSetting

(`key`) => `any`

Function to get a setting value by key

##### setSetting

(`key`, `value`) => `void`

Function to set a setting value by key

#### Returns

`SettingsDialogHelper`

---

### unregisterAll()

ts

```
unregisterAll(): void;
```

Defined in: [src/tools/ui.ts:50](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L50)

Remove all elements created by `createElement`.

#### Returns

`void`

#### Remarks

> What is this for?

In bootstrap plugins, elements must be manually maintained and removed on exiting.

This API does this for you.

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`unregisterAll`](./Class.DialogHelper.md#unregisterall)

---

### updateOptions()

ts

```
updateOptions(source?): SettingsDialogHelper;
```

Defined in: [src/basic.ts:442](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L442)

#### Parameters

##### source?

[`BasicTool`](Class.BasicTool.md) \| [`BasicOptions`](Interface.BasicOptions.md)

#### Returns

`SettingsDialogHelper`

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`updateOptions`](./Class.DialogHelper.md#updateoptions)

---

### getZotero()

ts

```
static getZotero(): typeof Zotero;
```

Defined in: [src/basic.ts:454](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L454)

#### Returns

*typeof* `Zotero`

#### Inherited from

[`DialogHelper`](Class.DialogHelper.md).[`getZotero`](./Class.DialogHelper.md#getzotero)
