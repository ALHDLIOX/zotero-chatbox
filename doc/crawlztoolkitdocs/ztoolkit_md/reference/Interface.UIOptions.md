# Interface: UIOptions

Defined in: [src/tools/ui.ts:421](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L421)

## Extends

- [`BasicOptions`](Interface.BasicOptions.md)

## Properties

### \_debug?

ts

```
optional _debug: object;
```

Defined in: [src/basic.ts:476](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L476)

#### disableDebugBridgePassword

ts

```
disableDebugBridgePassword: boolean;
```

#### password

ts

```
password: string;
```

#### Inherited from

[`BasicOptions`](Interface.BasicOptions.md).[`_debug`](./Interface.BasicOptions.md#debug)

---

### api

ts

```
api: object;
```

Defined in: [src/basic.ts:477](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L477)

#### pluginID

ts

```
pluginID: string;
```

#### Inherited from

[`BasicOptions`](Interface.BasicOptions.md).[`api`](./Interface.BasicOptions.md#api)

---

### debug

ts

```
debug: object;
```

Defined in: [src/basic.ts:472](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L472)

#### disableDebugBridgePassword

ts

```
disableDebugBridgePassword: boolean;
```

#### password

ts

```
password: string;
```

#### Inherited from

[`BasicOptions`](Interface.BasicOptions.md).[`debug`](./Interface.BasicOptions.md#debug)

---

### listeners

ts

```
listeners: object;
```

Defined in: [src/basic.ts:480](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L480)

#### \_mainWindow?

ts

```
optional _mainWindow: any;
```

#### \_plugin?

ts

```
optional _plugin: observer;
```

#### callbacks

ts

```
callbacks: object;
```

##### callbacks.onMainWindowLoad

ts

```
onMainWindowLoad: Set<(win) => void>;
```

##### callbacks.onMainWindowUnload

ts

```
onMainWindowUnload: Set<(win) => void>;
```

##### callbacks.onPluginUnload

ts

```
onPluginUnload: Set<(...args) => void>;
```

#### Inherited from

[`BasicOptions`](Interface.BasicOptions.md).[`listeners`](./Interface.BasicOptions.md#listeners)

---

### log

ts

```
log: object;
```

Defined in: [src/basic.ts:466](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L466)

#### \_type

ts

```
readonly _type: "toolkitlog";
```

#### disableConsole

ts

```
disableConsole: boolean;
```

#### disableZLog

ts

```
disableZLog: boolean;
```

#### prefix

ts

```
prefix: string;
```

#### Inherited from

[`BasicOptions`](Interface.BasicOptions.md).[`log`](./Interface.BasicOptions.md#log)

---

### ui

ts

```
ui: object;
```

Defined in: [src/tools/ui.ts:422](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/tools/ui.ts#L422)

#### enableElementDOMLog

ts

```
enableElementDOMLog: boolean;
```

Wether to log the DOM node mounted by `createElement`.

#### enableElementJSONLog

ts

```
enableElementJSONLog: boolean;
```

Wether to log the `ElementProps` parameter in `createElement`.

#### enableElementRecord

ts

```
enableElementRecord: boolean;
```

Whether to record elements created with `createElement`.
