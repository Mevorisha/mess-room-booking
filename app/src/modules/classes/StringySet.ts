/**
 * A Set implementation that uses toString() for comparison
 */
export default class StringySet<T> implements Iterable<T> {
  #map: Map<string, T>;

  /**
   * Create a new StringySet
   * @param {Iterable<T>} [iterable] - Optional initial values
   */
  constructor(iterable: Iterable<T> = []) {
    this.#map = new Map<string, T>();
    // Add initial values if provided
    for (const item of iterable) {
      this.add(item);
    }
  }

  /**
   * Add an item to the set
   * @param {T} item - The item to add
   * @returns {this} - The set instance
   */
  add(item: T): this {
    const key = String(item); // Calls toString() implicitly
    this.#map.set(key, item);
    return this;
  }

  /**
   * Check if the set has an item
   * @param {T} item - The item to check
   * @returns {boolean} - True if the item exists in the set
   */
  has(item: T): boolean {
    const key = String(item); // Calls toString() implicitly
    return this.#map.has(key);
  }

  /**
   * Delete an item from the set
   * @param {T} item - The item to delete
   * @returns {boolean} - True if an item was deleted
   */
  delete(item: T): boolean {
    const key = String(item); // Calls toString() implicitly
    return this.#map.delete(key);
  }

  /**
   * Clear all items from the set
   */
  clear(): void {
    this.#map.clear();
  }

  /**
   * Get the number of items in the set
   * @returns {number} - The number of items
   */
  get size(): number {
    return this.#map.size;
  }

  /**
   * Create a new set with items that pass the filter
   * @param {function(T): boolean} predicate - Function to test each item
   * @returns {StringySet<T>} - A new filtered set
   */
  filter(predicate: (arg0: T) => boolean): StringySet<T> {
    const result = new StringySet<T>();
    for (const item of this) {
      if (predicate(item)) {
        result.add(item);
      }
    }
    return result;
  }

  /**
   * Convert the set to an array.
   * @returns {T[]} - An array containing all items
   * NOTE: This works only coz StringySet class implements the iterator protocol through the [Symbol.iterator]() method.
   */
  toArray(): T[] {
    return Array.from(this);
  }

  /**
   * Iterator for the set (enables for...of loops)
   * @returns {Iterator<T>}
   */
  *[Symbol.iterator](): Iterator<T> {
    for (const value of this.#map.values()) {
      yield value;
    }
  }

  /**
   * Create a StringySet from an array
   * @template U
   * @param {U[]} array - The array to convert
   * @returns {StringySet<U>} - A new StringySet
   */
  static from<U>(array: U[]): StringySet<U> {
    return new StringySet(array);
  }
}
