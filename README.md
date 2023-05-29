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

