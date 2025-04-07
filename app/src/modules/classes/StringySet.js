/**
 * A Set implementation that uses toString() for comparison
 * @template T
 * @implements Iterable<T>
 */
export default class StringySet {
  /**
   * Create a new StringySet
   * @param {Iterable<T>} [iterable] - Optional initial values
   */
  constructor(iterable = []) {
    /** @private */
    this._map = new Map();

    // Add initial values if provided
    if (iterable) {
      for (const item of iterable) {
        this.add(item);
      }
    }
  }

  /**
   * Add an item to the set
   * @param {T} item - The item to add
   * @returns {this} - The set instance
   */
  add(item) {
    const key = String(item); // Calls toString() implicitly
    this._map.set(key, item);
    return this;
  }

  /**
   * Check if the set has an item
   * @param {T} item - The item to check
   * @returns {boolean} - True if the item exists in the set
   */
  has(item) {
    const key = String(item); // Calls toString() implicitly
    return this._map.has(key);
  }

  /**
   * Delete an item from the set
   * @param {T} item - The item to delete
   * @returns {boolean} - True if an item was deleted
   */
  delete(item) {
    const key = String(item); // Calls toString() implicitly
    return this._map.delete(key);
  }

  /**
   * Clear all items from the set
   */
  clear() {
    this._map.clear();
  }

  /**
   * Get the number of items in the set
   * @returns {number} - The number of items
   */
  get size() {
    return this._map.size;
  }

  /**
   * Create a new set with items that pass the filter
   * @param {function(T): boolean} predicate - Function to test each item
   * @returns {StringySet<T>} - A new filtered set
   */
  filter(predicate) {
    const result = new StringySet();
    for (const item of this) {
      if (predicate(item)) {
        result.add(item);
      }
    }
    return result;
  }

  /**
   * Convert the set to an array.
   * @returns {Array<T>} - An array containing all items
   * NOTE: This works only coz StringySet class implements the iterator protocol through the [Symbol.iterator]() method.
   */
  toArray() {
    return Array.from(this);
  }

  /**
   * Iterator for the set (enables for...of loops)
   * @returns {Iterator<T>}
   */
  *[Symbol.iterator]() {
    for (const value of this._map.values()) {
      yield value;
    }
  }

  /**
   * Create a StringySet from an array
   * @template U
   * @param {Array<U>} array - The array to convert
   * @returns {StringySet<U>} - A new StringySet
   */
  static from(array) {
    return new StringySet(array);
  }
}
