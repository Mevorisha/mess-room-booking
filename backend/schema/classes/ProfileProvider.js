import IMongoosable from "../interfaces/IMongoosable.js";
import DataError from "../errors/DataError.js";
import EProfleType from "../enums/EProfileType.js";
import { mkRandomNewUUID } from "../util/ids.js";
import { enforceInterfaceStaticMembers } from "../util/classes.js";

/**
ProviderProfile {
  profile_id   string pk
  account_id   string fk unique     valid(/^[A-Z0-9]{16}$/)
  profile_img  string url
  first_name   string               valid(none)
  last_name    string               valid(none)
  profile_type string ROOM_PROVIDER
  expires_at   Date                 // 500 years from now
} */

/**
 * @implements {IMongoosable}
 */
export default class ProfileProvider {
  /**
   * Create a ProfileProvider.
   * @param {string} profile_id - The profile id.
   * @param {string} account_id - The account id.
   * @param {string} profile_img - The profile image.
   * @param {string} first_name - The first name.
   * @param {string} last_name - The last name.
   * @param {string} profile_type - The profile type.
   * @param {Date} expires_at - The expiration date.
   * @throws Will throw an error if the profile id is not valid.
   * @throws Will throw an error if the account id is not valid.
   */
  constructor(
    profile_id,
    account_id,
    profile_img,
    first_name,
    last_name,
    profile_type,
    expires_at
  ) {
    if (!/^[A-Z0-9]{16}$/.test(profile_id)) {
      throw new DataError("Invalid profile id", 400, "invalid_profile_id");
    }
    if (!/^[A-Z0-9]{16}$/.test(account_id)) {
      throw new DataError("Invalid account id", 400, "invalid_account_id");
    }

    /** @type {string} */
    this.profile_id = profile_id;
    /** @type {string} */
    this.account_id = account_id;
    /** @type {string} */
    this.profile_img = profile_img;
    /** @type {string} */
    this.first_name = first_name;
    /** @type {string} */
    this.last_name = last_name;
    /** @type {string} */
    this.profile_type = profile_type;
    /** @type {Date} */
    this.expires_at = expires_at;
  }

  static getMongoSchema() {
    return {
      profile_id: {
        type: String,
        required: true,
        unique: true,
        // @ts-ignore
        default: () => mkRandomNewUUID(context._id ? context._id.toString() : ""),
      },
      account_id: {
        type: String,
        required: true,
        unique: true,
        validate: {
          validator: (v) => /^[A-Z0-9]{16}$/.test(v),
          message: "Invalid account id",
        },
      },
      profile_img: { type: String, required: true },
      first_name: { type: String, required: false },
      last_name: { type: String, required: false },
      profile_type: {
        type: String,
        required: true,
        default: EProfleType.val.ROOM_PROVIDER,
        validate: {
          validator: (v) => v === EProfleType.val.ROOM_PROVIDER,
          message: "Invalid profile type",
        },
      },
      expires_at: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 500 * 365 * 24 * 60 * 60 * 1000),
      },
    };
  }

  /**
   * @param {Object} mongoObject Document like object
   * @returns {ProfileProvider}
   */
  static fromMongoObject(mongoObject) {
    return new ProfileProvider(
      mongoObject.profile_id,
      mongoObject.account_id,
      mongoObject.profile_img,
      mongoObject.first_name,
      mongoObject.last_name,
      mongoObject.profile_type,
      mongoObject.expires_at
    );
  }

  /**
   * @static
   * @param {ProfileProvider} data
   * @returns {Object} Document like object
   */
  static toMongoObject(data) {
    return {
      profile_id: data.profile_id,
      account_id: data.account_id,
      profile_img: data.profile_img,
      first_name: data.first_name,
      last_name: data.last_name,
      profile_type: data.profile_type,
      expires_at: data.expires_at,
    };
  }
}

enforceInterfaceStaticMembers(ProfileProvider, IMongoosable);
