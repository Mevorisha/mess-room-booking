import IEnum from "../interfaces/IEnum";
import IMongoosable from "../interfaces/IMongoosable";

/**
 * @implements {IEnum}
 * @implements {IMongoosable}
 */
class EProfileType {
  /**
   * @static
   * @readonly
   * @public
   */
  val = {
    ROOM_TENANT: 'ROOM_TENANT',
    ROOM_PROVIDER: 'ROOM_PROVIDER',
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
   * @returns {'ROOM_TENANT' | 'ROOM_PROVIDER'}
   * @throws {Error} The data is not a valid enum value.
   */
  fromMongoObject(data) {
    switch (data) {
      case "ROOM_TENANT": return data;
      case "ROOM_PROVIDER": return data;
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

export default EProfileType;
