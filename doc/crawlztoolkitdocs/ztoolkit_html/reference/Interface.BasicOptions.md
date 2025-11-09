# Interface: BasicOptions

Defined in: [src/basic.ts:465](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L465)

## Extended by

- [`UIOptions`](Interface.UIOptions.md)

## Properties

### \_debug?

ts

```
optional _debug: object;
```

Defined in: [src/basic.ts:476](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L476)

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

---

### api

ts

```
api: object;
```

Defined in: [src/basic.ts:477](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L477)

#### pluginID

ts

```
pluginID: string;
```

---

### debug

ts

```
debug: object;
```

Defined in: [src/basic.ts:472](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L472)

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

---

### listeners

ts

```
listeners: object;
```

Defined in: [src/basic.ts:480](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L480)

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

---

### log

ts

```
log: object;
```

Defined in: [src/basic.ts:466](https://github.com/windingwind/zotero-plugin-toolkit/blob/21f946af06165550d50d9a30d96cba3184c78624/src/basic.ts#L466)

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
