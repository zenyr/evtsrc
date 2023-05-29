import { EventEmitter } from "node:events";
import { EOS_DEFAULT, Chunk } from "./type";

export class EvtSrcServer<
  T = unknown,
  EOS extends Chunk<unknown> = EOS_DEFAULT
> {
  private emitter = new EventEmitter();
  private promises = new Set<Promise<string>>();
  private _dead = false;
  private _tmr: NodeJS.Timer;
  constructor(
    private options: { asJson?: boolean; heartbeat?: number; eosMarker: EOS }
  ) {
    Object.assign(this.options, { asJson: false, heartbeat: 0 }, options);
    this.emitter.addListener("queue_message", this.processQueue);
    if (!this.options.eosMarker.data)
      throw new Error("Invalid EOS marker: no data.");
    this._tmr = setInterval(
      () => !this._dead && this.emitComment(` - Heartbeat: ${Date.now()} - `),
      this.options.heartbeat
    );
  }

  public emitMessage(chunk: Chunk<T> | EOS) {
    if (Object.keys(chunk).length === 0)
      throw new Error("Invalid emitMessage request: Nothing to emit.");

    const { data } = chunk;
    const { asJson } = this.options;
    if (!asJson && typeof data !== "string") {
      throw new Error(
        "Invalid data type: data must be a string or options.asJson must be enabled."
      );
    }

    this.emitter.emit("queue_message", chunk);
  }

  public emitComment(comment: string) {
    this.emitMessage({ comment });
  }

  private processQueue(chunk: Chunk<T> | EOS) {
    const message = [] as string[];
    if (chunk.comment) message.push(`:${chunk.comment.replace(/\n/g, "\n:")}`);
    if (chunk.eventName) {
      message.push(`event: ${chunk.eventName.replace(/\n/g, " ").trim()}`);
    }
    if (chunk.data) {
      if (this.options.asJson || typeof chunk.data !== "string") {
        const data = JSON.stringify(chunk.data);
        message.push(`data: ${data.replace(/\n/g, "\ndata: ")}`);
      } else {
        // data HAS to be a string
        message.push(`data: ${chunk.data.replace(/\n/g, "\ndata: ")}`);
      }
    }
    if (!message.length) return;

    this.emitter.emit("message", message.join("\n") + "\n\n");
  }

  get messagePromise(): Promise<string> {
    if (this._dead) return Promise.reject();
    const p = new Promise<string>((res, rej) => {
      const resolve = (e: string) => (clear(), res(e));
      const reject = () => (clear(), rej());
      const clear = () => {
        this.emitter.removeListener("message", resolve);
        this.emitter.removeListener("close", reject);
        this.promises.delete(p);
      };
      this.emitter.addListener("message", resolve);
      this.emitter.addListener("close", reject);
    });
    this.promises.add(p);
    return p;
  }

  public async close() {
    this.emitMessage(this.options.eosMarker);
    this._dead = true;
    clearInterval(this._tmr);
    await Promise.all([...this.promises.values()]);
    this.emitter.emit("close");
  }
}
