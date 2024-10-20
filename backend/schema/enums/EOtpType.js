import IEnum from "../interfaces/IEnum";
import IMongoosable from "../interfaces/IMongoosable";

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
  val = {
    EMAIL: 'EMAIL',
    MOBILE: 'MOBILE',
  }

  /**
   * @static
   */
  getMongoSchema() {
    return {
      type: String,
      enum: {
        values: Object.values(this.val),
        message: "EOtpType: {VALUE} is invalid; must be one of " + Object.values(this.val).join(", "),
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
  fromMongoObject(data) {
    switch (data) {
      case "EMAIL": return data;
      case "MOBILE": return data;
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

export default EOtpType;
