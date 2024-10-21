import IMongoosable from "../interfaces/IMongoosable";
import IMongoSchemaMethods from "../interfaces/IMongoSchemaMethods";
import DataError from "../errors/DataError";
import { autoincrMkNewAccountId, randomMkNewAccountId } from "../util/ids";
import { enforceInterfaceStaticMembers } from "../util/classes";

/**
Account {
  account_id        string pk      valid(/^[A-Z0-9]{16}$/)
  email             string?        valid(empty or /^.+@.+$/)
  email_isverified  boolean
  country_code      string         valid(/^\d+$/)
  mobile            string unique  valid(/^\d+$/)
  mobile_isverified boolean
} */

/**
 * @implements {IMongoosable}
 * @implements {IMongoSchemaMethods}
 */
export default class Account {
  /**
   * Create an Account.
   * @param {string} account_id - The account id.
   * @param {string|null} email - The email of the account.
   * @param {boolean} email_isverified - The email verification status.
   * @param {string} country_code - The country code of the account.
   * @param {string} mobile - The mobile number of the account.
   * @param {boolean} mobile_isverified - The mobile verification status.
   * @throws Will throw an error if the account id is not valid.
   * @throws Will throw an error if the email is not valid.
   * @throws Will throw an error if the country code is not valid.
   * @throws Will throw an error if the mobile is not valid.
   */
  constructor(
    account_id,
    email,
    email_isverified,
    country_code,
    mobile,
    mobile_isverified
  ) {
    if (!/^[A-Z0-9]{16}$/.test(account_id)) {
      throw new DataError("Invalid account id", 400, "invalid_account_id");
    }
    if (email !== null && !/^.+@.+$/.test(email)) {
      throw new DataError("Invalid email", 400, "invalid_email");
    }
    if (!/^\d+$/.test(country_code)) {
      throw new DataError("Invalid country code", 400, "invalid_country_code");
    }
    if (!/^\d+$/.test(mobile)) {
      throw new DataError("Invalid mobile", 400, "invalid_mobile");
    }

    /** @type {string} */
    this.account_id = account_id;
    /** @type {string|null} */
    this.email = email;
    /** @type {boolean} */
    this.email_isverified = email_isverified;
    /** @type {string} */
    this.country_code = country_code;
    /** @type {string} */
    this.mobile = mobile;
    /** @type {boolean} */
    this.mobile_isverified = mobile_isverified;
  }

  static getMongoSchema() {
    return {
      account_id: {
        type: String,
        unique: true,
        default: randomMkNewAccountId(),
        validate: {
          validator: (v) => /^[A-Z0-9]{16}$/.test(v),
          message: "Invalid account id",
        },
      },
      /** implementation detail, not part of the schema */
      is_default_account_id: {
        type: Boolean,
        default: true,
      },
      email: {
        type: String,
        validate: {
          validator: (v) => v === null || /^.+@.+$/.test(v),
          message: "Invalid email",
        },
      },
      email_isverified: {
        type: Boolean,
        required: true,
      },
      country_code: {
        type: String,
        required: true,
        validate: {
          validator: (v) => /^\d+$/.test(v),
          message: "Invalid country code",
        },
      },
      mobile: {
        type: String,
        required: true,
        unique: true,
        validate: {
          validator: (v) => /^\d+$/.test(v),
          message: "Invalid mobile",
        },
      },
      mobile_isverified: {
        type: Boolean,
        required: true,
      },
    };
  }

  /**
   * @static
   */
  static pres = {
    // generate autoincremented account ID
    // default is crypto generated random ID
    save: async function () {
      if (this.is_default_account_id) {
        this.account_id = await autoincrMkNewAccountId();
        this.is_default_account_id = false;
      }
    },
  };

  /**
   * @static
   */
  static posts = {};

  /**
   * @static
   */
  static statics = {};

  /**
   * @static
   */
  static methods = {};

  /**
   * @static
   * @param {Object} mongoObject
   * @returns {Account}
   */
  static fromMongoObject(mongoObject) {
    if (!mongoObject) {
      throw new Error("Invalid mongoObject");
    }
    return new Account(
      mongoObject.account_id,
      mongoObject.email,
      mongoObject.email_isverified,
      mongoObject.country_code,
      mongoObject.mobile,
      mongoObject.mobile_isverified
    );
  }

  /**
   * @static
   * @param {Account} data
   */
  static toMongoObject(data) {
    return {
      account_id: data.account_id,
      email: data.email,
      email_isverified: data.email_isverified,
      country_code: data.country_code,
      mobile: data.mobile,
      mobile_isverified: data.mobile_isverified,
    };
  }
}

enforceInterfaceStaticMembers(Account, IMongoSchemaMethods);
enforceInterfaceStaticMembers(Account, IMongoosable);
