import { Nullable } from "sharedtypes";

type AnyFunction = (value: unknown) => unknown;

export class AsyncLock {
  #promise: Promise<unknown>;
  #resolve: Nullable<AnyFunction> = null;

  constructor() {
    this.#promise = new Promise((resolve) => {
      this.#resolve = resolve;
    });
  }

  static create(): AsyncLock {
    return new AsyncLock();
  }

  clear(): void {
    if (this.#resolve != null) this.#resolve({});
  }

  onClear(callback?: Nullable<AnyFunction>): void {
    this.#promise = this.#promise.then(callback);
  }
}
