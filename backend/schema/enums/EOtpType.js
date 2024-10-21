import IEnum from "../interfaces/IEnum.js";
import IMongoosable from "../interfaces/IMongoosable.js";
import { enforceInterfaceStaticMembers } from "../util/classes.js";

/**
 * @implements {IEnum}
 * @implements {IMongoosable}
 */
class EOtpType {
  /**
   * @static
   * @readonly
   * @public
   */
  static val = {
    EMAIL: "EMAIL",
    MOBILE: "MOBILE",
  };

  /**
   * @static
   */
  static getMongoSchema() {
    return {
      type: String,
      enum: {
        values: Object.values(EOtpType.val),
        message:
          "EOtpType: {VALUE} is invalid; must be one of " +
          Object.values(EOtpType.val).join(", "),
      },
      required: true,
    };
  }

  /**
   * @static
   * @param {string} data - The data to convert from.
   * @returns {'EMAIL' | 'MOBILE'}
   * @throws {Error} The data is not a valid enum value.
   */
  static fromMongoObject(data) {
    switch (data) {
      case "EMAIL":
        return data;
      case "MOBILE":
        return data;
      default:
        throw new Error("Invalid data");
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

export default EOtpType;

enforceInterfaceStaticMembers(EOtpType, IEnum);
enforceInterfaceStaticMembers(EOtpType, IMongoosable);
