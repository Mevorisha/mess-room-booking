import IEnum from "../interfaces/IEnum.js";
import IMongoosable from "../interfaces/IMongoosable.js";
import { enforceInterfaceStaticMembers } from "../util/classes.js";

/**
 * @implements {IEnum}
 * @implements {IMongoosable}
 */
class EProfession {
  /**
   * @static
   * @readonly
   * @public
   */
  static val = {
    STUDENT: "STUDENT",
    WORKING: "WORKING",
  };

  /**
   * @static
   */
  static getMongoSchema() {
    return {
      type: String,
      enum: {
        values: Object.values(EProfession.val),
        message:
          "EProfession: {VALUE} is invalid; must be one of " +
          Object.values(EProfession.val).join(", "),
      },
      required: true,
    };
  }

  /**
   * @static
   * @param {string} data - The data to convert from.
   * @returns {'STUDENT' | 'WORKING'}
   * @throws {Error} The data is not a valid enum value.
   */
  static fromMongoObject(data) {
    switch (data) {
      case "STUDENT":
        return data;
      case "WORKING":
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

export default EProfession;

enforceInterfaceStaticMembers(EProfession, IEnum);
enforceInterfaceStaticMembers(EProfession, IMongoosable);
