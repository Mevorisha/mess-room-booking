import IEnum from "../interfaces/IEnum";
import IMongoosable from "../interfaces/IMongoosable";

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
  val = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    OTHER: 'OTHER',
  }

  /**
   * @static
   */
  getMongoSchema() {
    return {
      type: String,
      enum: {
        values: Object.values(this.val),
        message: "EGender: {VALUE} is invalid; must be one of " + Object.values(this.val).join(", "),
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
  fromMongoObject(data) {
    switch (data) {
      case "MALE": return data;
      case "FEMALE": return data;
      case "OTHER": return data;
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

export default EGender;
