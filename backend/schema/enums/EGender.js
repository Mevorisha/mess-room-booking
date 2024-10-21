import IEnum from "../interfaces/IEnum.js";
import IMongoosable from "../interfaces/IMongoosable.js";
import { enforceInterfaceStaticMembers } from "../util/classes.js";

/**
 * @implements {IEnum}
 * @implements {IMongoosable}
 */
class EGender {
  /**
   * @static
   * @readonly
   * @public
   */
  static val = {
    MALE: "MALE",
    FEMALE: "FEMALE",
    OTHER: "OTHER",
  };

  /**
   * @static
   */
  static getMongoSchema() {
    return {
      type: String,
      enum: {
        values: Object.values(EGender.val),
        message:
          "EGender: {VALUE} is invalid; must be one of " +
          Object.values(EGender.val).join(", "),
      },
      required: true,
    };
  }

  /**
   * @static
   * @param {string} data - The data to convert from.
   * @returns {'MALE' | 'FEMALE' | 'OTHER'}
   * @throws {Error} The data is not a valid enum value.
   */
  static fromMongoObject(data) {
    switch (data) {
      case "MALE":
        return data;
      case "FEMALE":
        return data;
      case "OTHER":
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

export default EGender;

enforceInterfaceStaticMembers(EGender, IEnum);
enforceInterfaceStaticMembers(EGender, IMongoosable);
