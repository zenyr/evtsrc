import { EventEmitter } from "node:events";
import { EOS_DEFAULT, Chunk } from "../type";

export class EvtSrcServer<
  T = unknown,
  EOS extends Chunk<unknown> = EOS_DEFAULT
> {
  private emitter = new EventEmitter();
  private promises = new Set<Promise<string>>();
  private _dead = false;
  private _tmr: NodeJS.Timer | undefined;
  constructor(
    private options: { asJson?: boolean; heartbeat?: number; eosMarker: EOS }
  ) {
    const _options = Object.assign({ asJson: false, heartbeat: 0 }, options);
    this.options = _options;

    this.emitter.addListener("queue_message", this.processQueue);
    if (!this.options.eosMarker.data)
      throw new Error("Invalid EOS marker: no data.");
    if (this.options.heartbeat) {
      this._tmr = setInterval(
        this.heartbeat.bind(this),
        this.options.heartbeat
      );
    }
  }

  /**
   * Emits a message to the queue. The message can either be a chunk of data or an EOS (End of Stream) marker.
   *
   * @param {Chunk<T> | EOS} chunk - The message to emit. Must have at least one property.
   * @throws {Error} If the chunk has no properties, or if data is not a string and options.asJson is not enabled.
   */
  public emitMessage(chunk: Chunk<T> | EOS) {
    if (Object.keys(chunk).length === 0)
      throw new Error("Invalid emitMessage request: Nothing to emit.");

    const { data } = chunk;
    const { asJson } = this.options;
    if (data && !asJson && typeof data !== "string") {
      throw new Error(
        "Invalid data type: data must be a string or options.asJson must be enabled."
      );
    }

    this.emitter.emit("queue_message", chunk);
  }

  /**
   * Emits a comment. This is a convenience method for keeping the connection alive / debug.
   *
   * @param {string} comment - The comment to emit.
   */
  public emitComment(comment: string) {
    this.emitMessage({ comment });
  }

  /**
   * (Private)
   * Processes a message from the queue, formatting it as a string and emitting it as a 'message' event.
   *
   * @param {Chunk<T> | EOS} chunk - The message to process.
   */
  private processQueue = (chunk: Chunk<T> | EOS) => {
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
  };

  /**
   * Returns a Promise that resolves with the next message event data.
   * If closed, it rejects Promise immediately.
   *
   * @returns {Promise<string>} A Promise that resolves with the data of the next message event.
   */
  get messagePromise(): Promise<string> {
    if (this._dead) return Promise.reject(new Error("Connection closed."));
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

  private heartbeat() {
    !this._dead && this.emitComment(` - Heartbeat: ${Date.now()} - `);
  }

  /**
   * Closes the connection, emits an EOS marker, and emits a 'close' event once all pending Promises have resolved.
   *
   * @returns {Promise<void>} A Promise that resolves when all pending Promises have resolved.
   */
  public async close(): Promise<void> {
    this.emitMessage(this.options.eosMarker);
    this._dead = true;
    if (this._tmr) clearInterval(this._tmr);
    await Promise.all([...this.promises.values()]);
    this.promises.clear();
    this.emitter.emit("close");
  }
}
