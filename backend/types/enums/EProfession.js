import IEnum from "../interfaces/IEnum";
import IMongoosable from "../interfaces/IMongoosable";

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
  val = {
    STUDENT: 'STUDENT',
    WORKING: 'WORKING',
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
   * @returns {'STUDENT' | 'WORKING'}
   * @throws {Error} The data is not a valid enum value.
   */
  fromMongoObject(data) {
    switch (data) {
      case "STUDENT": return data;
      case "WORKING": return data;
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

export default EProfession;
