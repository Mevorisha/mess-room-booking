export class AsyncLock {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #promise: Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #resolve: null | ((value: any) => void) = null;

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClear(callback: ((value: any) => any) | null | undefined): void {
    this.#promise = this.#promise.then(callback);
  }
}
