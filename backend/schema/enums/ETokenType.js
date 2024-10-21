import IEnum from "../interfaces/IEnum";
import IMongoosable from "../interfaces/IMongoosable";
import { enforceInterfaceStaticMembers } from "../util/classes";

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
  static val = {
    ACCESS: 'ACCESS',
    REFRESH: 'REFRESH',
  }

  /**
   * @static
   */
  static getMongoSchema() {
    return {
      type: String,
      enum: {
        values: Object.values(ETokenType.val),
        message: "ETokenType: {VALUE} is invalid; must be one of " + Object.values(ETokenType.val).join(", "),
      },
      required: true,
    };
  }

  /**
   * @static
   * @param {string} data - The data to convert from.
   * @returns {'ACCESS' | 'REFRESH'}
   * @throws {Error} The data is not a valid enum value.
   */
  static fromMongoObject(data) {
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
  static toMongoObject(data) {
    return data;
  }
}

export default ETokenType;

enforceInterfaceStaticMembers(ETokenType, IEnum);
enforceInterfaceStaticMembers(ETokenType, IMongoosable);
