# Class: MessageHelper\<\_TargetHandlers>

Defined in: [src/helpers/message.ts:151](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L151)

**`Beta`**

Helper class to manage messages between workers/iframes and their parent

## Examples

Use the `MessageHelper` to create a server that can be used to communicate between workers or iframes and their parent.

In the child `worker.js`:

typescript

```
const handlers = {
  async test() {
    return "test";
  },
};
// Create a new server
const server = new MessageHelper({
  name: "child",
  handlers,
  canBeDestroyed: true,
});
// Start the listener
server.start();
// Export the handlers for type hinting
export { handlers };
```

In the parent:

typescript

```
// Import the handlers
import type { handlers } from "./worker.js";
// Create a new worker
const worker = new Worker("worker.js");
// Create a new server with the type from the target handlers
const server = new MessageHelper<typeof handlers>({
  name: "worker",
  handlers: {
    async test() {
      return "test";
    },
  },
  target: worker,
});
server.start();
// Execute the handlers defined in the worker as if they were local
ztoolkit.log(await server.proxy.test());
// ...
// Stop the server, can be restarted with server.start()
server.stop();
// Destroy the server and the worker
server.destroy();
```

Evaluate code in the other side of the server

typescript

```
await server.eval("self.firstName = 'John';");
```

Get a property from the other side of the server, can be nested.

Only works if the property is a primitive or a serializable object

typescript

```
ztoolkit.log(await server.get("self.firstName"));
```

Set a property from the other side of the server, can be nested.

Only works if the property is a primitive or a serializable object

typescript

```
await server.set("self.firstName", "Alice");
```

Check if the target is alive

typescript

```
ztoolkit.log(await server.isTargetAlive());
// Alternatively, send a ping message
ztoolkit.log(await server.proxy._ping());
```

## Type Parameters

### \_TargetHandlers

`_TargetHandlers` *extends* `MessageHandlers`

## Constructors

### Constructor

ts

```
new MessageHelper<_TargetHandlers>(config): MessageHelper<_TargetHandlers>;
```

Defined in: [src/helpers/message.ts:184](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L184)

**`Beta`**

#### Parameters

##### config

`MessageServerConfig`

#### Returns

`MessageHelper`\<`_TargetHandlers`\>

## Properties

### config

ts

```
protected config: Required<MessageServerConfig>;
```

Defined in: [src/helpers/message.ts:152](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L152)

**`Beta`**

---

### env

ts

```
protected env: "browser" | "content" | "webworker" | "chromeworker";
```

Defined in: [src/helpers/message.ts:154](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L154)

**`Beta`**

---

### listener?

ts

```
protected optional listener: any;
```

Defined in: [src/helpers/message.ts:156](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L156)

**`Beta`**

---

### proxy

ts

```
proxy: PromisedMessageHandlers<_TargetHandlers & BuiltInMessageHandlers>;
```

Defined in: [src/helpers/message.ts:163](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L163)

**`Beta`**

Proxy object to call the message handlers

---

### running

ts

```
running: boolean = false;
```

Defined in: [src/helpers/message.ts:158](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L158)

**`Beta`**

## Accessors

### privileged

#### Get Signature

ts

```
get privileged(): boolean;
```

Defined in: [src/helpers/message.ts:180](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L180)

**`Beta`**

##### Returns

`boolean`

---

### target

#### Get Signature

ts

```
get target(): Window | Worker;
```

Defined in: [src/helpers/message.ts:176](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L176)

**`Beta`**

##### Returns

`Window` \| `Worker`

## Methods

### call()

ts

```
call(func, args): Promise<MessageReturnType<_TargetHandlers & BuiltInMessageHandlers>["_call"]>;
```

Defined in: [src/helpers/message.ts:403](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L403)

**`Beta`**

#### Parameters

##### func

`string`

##### args

`any`\[\]

#### Returns

`Promise`\<`MessageReturnType`\<`_TargetHandlers` & `BuiltInMessageHandlers`\>\[`"_call"`\]\>

---

### destroy()

ts

```
destroy(): void;
```

Defined in: [src/helpers/message.ts:339](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L339)

**`Beta`**

#### Returns

`void`

---

### eval()

ts

```
eval(code): Promise<MessageReturnType<_TargetHandlers & BuiltInMessageHandlers>["_eval"]>;
```

Defined in: [src/helpers/message.ts:418](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L418)

**`Beta`**

#### Parameters

##### code

`string`

#### Returns

`Promise`\<`MessageReturnType`\<`_TargetHandlers` & `BuiltInMessageHandlers`\>\[`"_eval"`\]\>

---

### exec()

ts

```
exec<_HandlersName, _HandlersType>(
   name,
   params?,
options?): Promise<Awaited<MessageReturnType<_HandlersType>[_HandlersName]>>;
```

Defined in: [src/helpers/message.ts:354](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L354)

**`Beta`**

#### Type Parameters

##### \_HandlersName

`_HandlersName` *extends* `string` \| `number` \| `symbol`

##### \_HandlersType

`_HandlersType` *extends* `MessageHandlers` & `BuiltInMessageHandlers`

#### Parameters

##### name

`_HandlersName`

##### params?

`MessageParams`\<`_HandlersType`\>\[`_HandlersName`\]

##### options?

###### timeout?

`number`

#### Returns

`Promise`\<`Awaited`\<`MessageReturnType`\<`_HandlersType`\>\[`_HandlersName`\]\>\>

---

### get()

ts

```
get(key): Promise<MessageReturnType<_TargetHandlers & BuiltInMessageHandlers>["_get"]>;
```

Defined in: [src/helpers/message.ts:408](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L408)

**`Beta`**

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`MessageReturnType`\<`_TargetHandlers` & `BuiltInMessageHandlers`\>\[`"_get"`\]\>

---

### isTargetAlive()

ts

```
isTargetAlive(): Promise<boolean>;
```

Defined in: [src/helpers/message.ts:459](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L459)

**`Beta`**

#### Returns

`Promise`\<`boolean`\>

---

### send()

ts

```
send(options): Promise<string>;
```

Defined in: [src/helpers/message.ts:423](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L423)

**`Beta`**

#### Parameters

##### options

###### data

`any`

###### jobID?

`string`

###### name

`string`

###### requestReturn?

`boolean`

###### success?

`boolean`

#### Returns

`Promise`\<`string`\>

---

### set()

ts

```
set(key, value): Promise<MessageReturnType<_TargetHandlers & BuiltInMessageHandlers>["_set"]>;
```

Defined in: [src/helpers/message.ts:413](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L413)

**`Beta`**

#### Parameters

##### key

`string`

##### value

`any`

#### Returns

`Promise`\<`MessageReturnType`\<`_TargetHandlers` & `BuiltInMessageHandlers`\>\[`"_set"`\]\>

---

### start()

ts

```
start(): void;
```

Defined in: [src/helpers/message.ts:254](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L254)

**`Beta`**

#### Returns

`void`

---

### stop()

ts

```
stop(): void;
```

Defined in: [src/helpers/message.ts:331](/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-plugin-toolkit/src/helpers/message.ts#L331)

**`Beta`**

#### Returns

`void`
