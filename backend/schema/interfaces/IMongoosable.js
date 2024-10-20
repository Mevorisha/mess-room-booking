/**
 * @interface IMongoosable
 */
class IMongoosable {
  /**
   * @static
   * @returns {object} The mongoose schema.
   */
  static getMongoSchema() {
    throw new Error('Method not implemented.');
  }

  /**
   * @static
   * @param {any} mongoObject - The data to convert from a MongoDB object.
   */
  static fromMongoObject(mongoObject) {
    throw new Error('Method not implemented.');
  }

  /**
   * @static
   * @param {any} data - The data to convert to a MongoDB object.
   */
  static toMongoObject(data) {
    throw new Error('Method not implemented.');
  }
}

export default IMongoosable;
