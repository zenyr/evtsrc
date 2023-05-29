// This file assumes that EventSource is globally available.
import { EOS_DEFAULT } from "../type";
export class EvtSrcClient<T = unknown, EOS = EOS_DEFAULT> extends EventSource {
  private _lastMessage: T | null = null;
  private _eosMarker: string;
  constructor(
    url: string,
    options: Partial<EventSourceInit> & { eosMarker: EOS_DEFAULT }
  ) {
    super(url, options);
    this._eosMarker = JSON.stringify(options.eosMarker);
  }

  /**
   * Returns a Promise that resolves when the EventSource connection opens,
   * or rejects when an error event occurs.
   *
   * @returns {Promise<boolean>} A Promise that resolves when the EventSource connection opens.
   */
  get connectionChangePromise(): Promise<boolean> {
    return new Promise((res, rej) => {
      const resolve = () => (
        clear(), res(this.readyState === EventSource.OPEN)
      );
      const reject = () => (clear(), rej());
      const clear = () => {
        this.removeEventListener("open", resolve);
        this.removeEventListener("error", reject);
      };
      this.addEventListener("open", resolve);
      this.addEventListener("error", reject);
    });
  }

  /**
   * Returns a Promise that resolves when the EventSource connection is open.
   * If the connection is already open, it returns a resolved Promise.
   * Otherwise, it returns a Promise that resolves when the connection state changes.
   *
   * @returns {Promise<boolean>} A Promise that resolves when the EventSource connection is open.
   */
  get connectionPromise(): Promise<boolean> {
    if (this.readyState === EventSource.OPEN) return Promise.resolve(true);
    return this.connectionChangePromise;
  }

  /**
   * Returns a Promise that resolves when a new message event is received,
   * or rejects when an error event occurs. The resolved value is the data of the message event.
   *
   * @returns {Promise<T|EOS>} A Promise that resolves with the data of the next message event.
   */
  get messageChangePromise(): Promise<T | EOS> {
    return this.messageChangePromiseByEventName("message");
  }

  /**
   * Returns a Promise that resolves with the most recent message event data.
   * If no message has been received yet, it returns a Promise that resolves
   * with the data of the next message event.
   *
   * @returns {Promise<T|EOS>} A Promise that resolves with the data of the last or next message event.
   */
  get messagePromise(): Promise<T | EOS> {
    if (this._lastMessage) return Promise.resolve(this._lastMessage);
    return this.messageChangePromise;
  }

  messageChangePromiseByEventName(eventName: string): Promise<T | EOS> {
    return new Promise<T | EOS>((res, rej) => {
      const resolve = (e: MessageEvent<T>) => {
        const message = e.data as T;
        // check for EOS marker
        if (JSON.stringify(message) === this._eosMarker) {
          // close connection gracefully, since server sent us an EOS marker
          return clear(), res(message as unknown as EOS), this.close();
        }

        return clear(), (this._lastMessage = message), res(message);
      };
      const reject = () => (clear(), rej());
      const clear = () => {
        this.removeEventListener(eventName, resolve);
        this.removeEventListener("error", reject);
        this.removeEventListener("close", reject);
      };
      this.addEventListener(eventName, resolve);
      this.addEventListener("error", reject);
      this.addEventListener("close", reject);
    });
  }

  close(): void {
    try {
      this.dispatchEvent(new Event("close"));
    } catch {
      // ignore
    }
    super.close();
  }
}
