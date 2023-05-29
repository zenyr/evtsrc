// This file assumes that EventSource is globally available.

export class EvtSrcClient<T = unknown> extends EventSource {
    private _lastMessage: T | null = null;
    constructor(url: string, options?: EventSourceInit) {
      super(url, options);
    }
    get connectionChangePromise(): Promise<void> {
      return new Promise((res, rej) => {
        const resolve = () => (clear(), res());
        const reject = () => (clear(), rej());
        const clear = () => {
          this.removeEventListener("open", resolve);
          this.removeEventListener("error", reject);
        };
        this.addEventListener("open", resolve);
        this.addEventListener("error", reject);
      });
    }
  
    get connectionPromise(): Promise<void> {
      if (this.readyState === EventSource.OPEN) return Promise.resolve();
      return this.connectionChangePromise;
    }
  
    get messageChangePromise(): Promise<T> {
      return new Promise((res, rej) => {
        const resolve = (e: MessageEvent) => (
          clear(), (this._lastMessage = e.data as T), res(e.data as T)
        );
        const reject = () => (clear(), rej());
        const clear = () => {
          this.removeEventListener("message", resolve);
          this.removeEventListener("error", reject);
        };
        this.addEventListener("message", resolve);
        this.addEventListener("error", reject);
      });
    }
  
    get messagePromise(): Promise<T> {
      if (this._lastMessage) return Promise.resolve(this._lastMessage);
      return this.messageChangePromise;
    }
  }
  