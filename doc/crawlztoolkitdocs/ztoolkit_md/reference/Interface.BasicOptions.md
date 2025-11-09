# Interface: BasicOptions

Defined in: [src/basic.ts:465](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/basic.ts#L465)

## Extended by

- [`UIOptions`](Interface.UIOptions.md)

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
