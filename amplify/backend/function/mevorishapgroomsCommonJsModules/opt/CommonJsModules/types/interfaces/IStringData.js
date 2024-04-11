/**
 * @interface
 */
class IStringData {
  /**
   * @abstract
   * @returns {string}
   */
  toStringData() {
    throw new TypeError("Abstract method not implemented");
  }

  /**
   * @deprecated
   */
  toString() {}
}

module.exports = IStringData;
