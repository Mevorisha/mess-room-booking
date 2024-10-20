import IEnum from "../interfaces/IEnum";
import IMongoosable from "../interfaces/IMongoosable";

/**
 * @implements {IEnum}
 * @implements {IMongoosable}
 */
class ETokenType {
  /**
   * @static
   * @readonly
   * @public
   */
  val = {
    ACCESS: 'ACCESS',
    REFRESH: 'REFRESH',
  }

  /**
   * @static
   */
  getMongoSchema() {
    return {
      type: String,
      enum: Object.values(this.val),
      required: true,
    };
  }

  /**
   * @static
   * @param {string} data - The data to convert from.
   * @returns {'ACCESS' | 'REFRESH'}
   * @throws {Error} The data is not a valid enum value.
   */
  fromMongoObject(data) {
    switch (data) {
      case "ACCESS": return data;
      case "REFRESH": return data;
      default: throw new Error("Invalid data");
    }
  }

  /**
   * @static
   * @param {string} data - The data to convert from.
   */
  toMongoObject(data) {
    return data;
  }
}

export default ETokenType;
