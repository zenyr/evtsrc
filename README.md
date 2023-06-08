# Evtsrc

- EventSource, written in TypeScript with 2023 syntax, and without any runtime dependencies.
- This is actually a side project by the author, discretely experimenting with [SWC](https://swc.rs/).

# Installation

```
yarn add evtsrc
```

- No dependencies, only a few devDependencies.

# Usage

## 1. Browser environment (requires vite, webpack etc.)

```ts
import { EvtSrcClient } from "evtsrc";

// same usage as EventSource but with a few added methods:
// 1. Awaits until connection state changes
// get connectionChangePromise(): Promise<void>;
// 2. Waits for a new message to arrive
// get messageChangePromise(): Promise<T>;
// 3. Returns immediately if connected, otherwise await
// get connectionPromise(): Promise<void>;
// 4. Returns any messages(might be stale) arrived, otherwise await
// get messagePromise(): Promise<T>;
//
// All promises may reject on bad conditions like when server intentionally disconnects a SSE source. Please catch them accordingly ;)

// Todo: better demo code here
```

## 2. Node.js environment

```ts
import { EvtSrcServer } from "evtsrc";

// Inherits native EventEmitter but the main juice happens with those methods:
//
// 1. Ctor receives a few options. `eosMarker` is required!
// constructor(options: {
//     asJson?: boolean;
//     heartbeat?: number;
//     eosMarker: EOS;
// });
//
// emitMessage(chunk: Chunk<T> | EOS): void;
//
// emitComment(comment: string): void;
//
// private processQueue;
//
// get messagePromise(): Promise<string>;
//
// close(): Promise<void>;
//
// Todo: Better demo code here
```

## Why?

- Utilizing EventSource in both browser and Node.js server necessitates the use of a callback function, leading to a non-linear data flow.
- As a Node.js server developer, you might want to avoid bloating your `node_modules` simply to dispatch a few Server-Sent Events (also known as Server Side Events, SSE, etc.)
  - If not, you'll have to manually implement [this specification](https://html.spec.whatwg.org/multipage/server-sent-events.html).
  - There are packages available that facilitate emitting server-side events, but they often require acting as specific middleware or taking control of the response object.
- This package tries to provide a few helper promises to easily await inside a for loop.

## Contribution

- Feel free to suggest me an idea. Github messages are not the best way to contact me though... (too much noise ratio)

# Changelog

### 1.1.0

    - Client
        - Support `event: ` case
        - Support EOS marker
    - Server
        - Skip heartbeat with falsy value


### 1.0.0 : Initial publish

---

**Class: EvtSrcServer**

Represents an event source server.

**Constructor:**

```typescript
constructor(options: {
  asJson?: boolean;
  heartbeat?: number;
  eosMarker: EOS;
})
```

Creates an instance of `EvtSrcServer`.

- `options` (required): An object that specifies the server options.
  - `asJson` (optional): A boolean indicating whether the data should be emitted as JSON. Default is `false`.
  - `heartbeat` (optional): The interval (in milliseconds) for sending heartbeat comments to keep the connection alive. Set to `0` to disable. Default is `0`.
  - `eosMarker` (required): An object representing the End of Stream (EOS) marker.

**Method: emitMessage**

```typescript
public emitMessage(chunk: Chunk<T> | EOS): void
```

Emits a message to the queue. The message can either be a chunk of data or an EOS (End of Stream) marker.

- `chunk` (required): The message to emit. Must have at least one property.

**Method: emitComment**

```typescript
public emitComment(comment: string): void
```

Emits a comment. This is a convenience method for keeping the connection alive or for debugging purposes.

- `comment` (required): The comment to emit.

**Method: close**

```typescript
public async close(): Promise<void>
```

Closes the connection, emits an EOS marker, and emits a 'close' event once all pending Promises have resolved.

Returns:
- A `Promise` that resolves when all pending Promises have resolved.

**Getter: messagePromise**

```typescript
get messagePromise(): Promise<string>
```

Returns a `Promise` that resolves with the next message event data. If the connection is closed, the Promise is rejected immediately.

Returns:
- A `Promise` that resolves with the data of the next message event.

---

**Class: EvtSrcClient**

Represents an event source client that extends the `EventSource` class.

**Constructor:**

```typescript
constructor(url: string, options: Partial<EventSourceInit> & { eosMarker: EOS_DEFAULT })
```

Creates an instance of `EvtSrcClient`.

- `url` (required): The URL of the server-side event source.
- `options` (required): An object that specifies additional options for the event source connection.
  - `eosMarker` (required): The End of Stream (EOS) marker.

**Method: connectionChangePromise**

```typescript
get connectionChangePromise(): Promise<boolean>
```

Returns a `Promise` that resolves when the `EventSource` connection opens or rejects when an error event occurs.

Returns:
- A `Promise<boolean>` that resolves when the `EventSource` connection opens.

**Method: connectionPromise**

```typescript
get connectionPromise(): Promise<boolean>
```

Returns a `Promise` that resolves when the `EventSource` connection is open. If the connection is already open, it returns a resolved Promise. Otherwise, it returns a Promise that resolves when the connection state changes.

Returns:
- A `Promise<boolean>` that resolves when the `EventSource` connection is open.

**Method: messageChangePromise**

```typescript
get messageChangePromise(): Promise<T | EOS>
```

Returns a `Promise` that resolves when a new message event is received or rejects when an error event occurs. The resolved value is the data of the message event.

Returns:
- A `Promise<T | EOS>` that resolves with the data of the next message event.

**Method: messagePromise**

```typescript
get messagePromise(): Promise<T | EOS>
```

Returns a `Promise` that resolves with the most recent message event data. If no message has been received yet, it returns a Promise that resolves with the data of the next message event.

Returns:
- A `Promise<T | EOS>` that resolves with the data of the last or next message event.

**Method: messageChangePromiseByEventName**

```typescript
messageChangePromiseByEventName(eventName: string): Promise<T | EOS>
```

Returns a `Promise` that resolves with the data of the next message event with the specified event name or rejects when an error event occurs.

- `eventName` (required): The name of the event to listen for.

Returns:
- A `Promise<T | EOS>` that resolves with the data of the next message event.

**Method: close**

```typescript
close(): void
```

Closes the connection and dispatches a "close" event.
