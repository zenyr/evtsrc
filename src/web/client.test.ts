// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from "vitest";
import EventSourceMock, { sources } from "eventsourcemock";
import { setTimeout } from "timers/promises";
vi.stubGlobal("EventSource", EventSourceMock);
// missing from EventSourceMock
EventSourceMock.OPEN = 1;
EventSourceMock.CONNECTING = 0;
EventSourceMock.CLOSED = 2;

// @ts-expect-error
const { EvtSrcClient } = await import("./client");
// import { EvtSrcClient } from "./client";

const eosMarker = { data: "done" };
describe("basic client stuff", () => {
  it("should initialize & connect", async () => {
    const evtsrc = new EvtSrcClient("http://localhost/bar", { eosMarker });
    expect(evtsrc).toBeDefined();
    expect(evtsrc.readyState).toBe(EventSource.CONNECTING);
    const src = sources[evtsrc.url];
    src.emitOpen();
    expect(evtsrc.readyState).toBe(EventSource.OPEN); // OPEN
    src.close();
    expect(evtsrc.readyState).toBe(EventSource.CLOSED); // CLOSED
  });

  it("should provide connection promise", async () => {
    const evtsrc = new EvtSrcClient("http://localhost/barr", { eosMarker });
    const p1 = evtsrc.connectionChangePromise;
    const p2 = evtsrc.connectionPromise;
    const src = sources[evtsrc.url];
    src.emitOpen();
    // missing from EventSourceMock
    src.__emitter.emit("open");
    expect(await p1).toBe(true);
    expect(await p2).toBe(true);
  });

  it("should receive unnamed events", async () => {
    const evtsrc = new EvtSrcClient("http://localhost/baz", { eosMarker });
    const src = sources[evtsrc.url];
    src.emitOpen();

    const p1 = evtsrc.messageChangePromise;
    const p2 = evtsrc.messagePromise;
    const msgEvt = new MessageEvent("message", {
      data: "message event data",
    });
    src.emit("message", msgEvt);
    const p3 = evtsrc.messagePromise;
    expect(await p1).toEqual(msgEvt.data);
    expect(await p2).toEqual(msgEvt.data);
    expect(await p3).toEqual(msgEvt.data);
  });

  it("should receive named events", async () => {
    const evtsrc = new EvtSrcClient("http://localhost/baf", { eosMarker });
    const src = sources[evtsrc.url];
    src.emitOpen();
    const msgEvt = new MessageEvent("type", {
      data: "message event data",
    });
    const p1 = evtsrc.messageChangePromiseByEventName(msgEvt.type);
    src.emit(msgEvt.type, msgEvt);
    expect(await p1).toEqual(msgEvt.data);
    const p2 = evtsrc.messageChangePromiseByEventName(msgEvt.type);
    evtsrc.close();
    src.__emitter.emit("error");
    await expect(p2).rejects.toThrow();
  });

  it("should close gracefully", async () => {
    const evtsrc = new EvtSrcClient("http://localhost/bak", { eosMarker });
    const src = sources[evtsrc.url];
    src.emitOpen();
    const p1 = evtsrc.messageChangePromise;
    src.emit('message',eosMarker);
    evtsrc.close();
    expect(await p1).toEqual(eosMarker.data);
  });
});
