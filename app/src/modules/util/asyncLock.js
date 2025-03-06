export class AsyncLock {
  promise;
  resolve;
  reject;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  static create() {
    return new AsyncLock();
  }

  clear() {
    this.resolve();
  }

  onClear(callback) {
    this.promise = this.promise.then(callback);
  }
}
