import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { EvtSrcServer } from "./server";

const EOS = { data: "EOS" };

describe("basic server stuff", () => {
  it("should initialize", () => {
    const evtsrc = new EvtSrcServer({ eosMarker: EOS });
    expect(evtsrc).toBeDefined();
  });
  it("should fail with broken eosMarker", () => {
    expect(() => new EvtSrcServer({ eosMarker: {} })).toThrow();
    // @ts-expect-error
    expect(() => new EvtSrcServer({ eosMarker: { dank: "meme" } })).toThrow();
  });
  it("should process emitMessage", async () => {
    const evtsrc = new EvtSrcServer({ eosMarker: EOS });
    const p = evtsrc.messagePromise;
    evtsrc.emitMessage({ data: "test" });
    const result = await p;
    expect(result).toEqual(`data: test\n\n`);
  });
  it("should process emitMessage with eventName", async () => {
    const evtsrc = new EvtSrcServer({ eosMarker: EOS });
    const p = evtsrc.messagePromise;
    evtsrc.emitMessage({ eventName: "foo", data: "bar" });
    const result = await p;
    expect(result).toEqual(`event: foo\ndata: bar\n\n`);
  });
  it("should receive EOS token when closed", async () => {
    const evtsrc = new EvtSrcServer({ eosMarker: EOS });
    const p = evtsrc.messagePromise;
    evtsrc.close();
    const result = await p;
    expect(result).toEqual(`data: EOS\n\n`);
  });
  it("should receive *Named* EOS token when closed", async () => {
    const evtsrc = new EvtSrcServer({
      eosMarker: { eventName: "Foo", data: "Bar" },
    });
    const p = evtsrc.messagePromise;
    evtsrc.close();
    const result = await p;
    expect(result).toEqual(`event: Foo\ndata: Bar\n\n`);
  });
});

describe("heartbeat", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should not emit heartbeat if not configured", async () => {
    const evtsrc = new EvtSrcServer({ eosMarker: EOS });
    const spy = vi.spyOn(evtsrc, "emitComment");
    vi.advanceTimersByTime(100000);
    expect(spy).not.toHaveBeenCalled();
  });
  it("should emit heartbeat if configured", async () => {
    const evtsrc = new EvtSrcServer({ eosMarker: EOS, heartbeat: 1000 });
    const spy = vi.spyOn(evtsrc, "emitComment");
    vi.advanceTimersByTime(3500);
    expect(spy).toBeCalledTimes(3);
  });
});

describe("asJson / weird inputs", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it("should reject json input", () => {
    const evtsrc = new EvtSrcServer({ eosMarker: EOS });
    expect(() => evtsrc.emitMessage({ data: { hi: "there" } })).toThrow();
  });
  it("should allow json input", () => {
    const evtsrc = new EvtSrcServer({ asJson: true, eosMarker: EOS });
    expect(() => evtsrc.emitMessage({ data: { hi: "there" } })).not.toThrow();
  });
  it("should reject stupid input", () => {
    const evtsrc = new EvtSrcServer({ eosMarker: EOS });
    expect(() => evtsrc.emitMessage({})).toThrow();
  });
  it("should reject promise after closed", async () => {
    const evtsrc = new EvtSrcServer({ heartbeat: 1000, eosMarker: EOS });
    const spy = vi.spyOn(evtsrc, "emitComment");
    evtsrc.close();
    await expect(evtsrc.messagePromise).rejects.toThrow();
    vi.advanceTimersByTime(3500);
    expect(spy).toBeCalledTimes(0);
  });
});
