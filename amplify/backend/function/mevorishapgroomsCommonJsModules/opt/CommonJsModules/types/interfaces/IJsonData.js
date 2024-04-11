/**
 * @interface IJsonData
 */
class IJsonData {
  /**
   * @returns {any}
   */
  toJsonData() {
    throw new TypeError('Abstract method not implemented');
  }
}

module.exports = IJsonData;
