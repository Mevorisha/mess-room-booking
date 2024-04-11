const mongoose = require("mongoose");
const defaultExpiration = require("../config/defaultExpiration");

const AccountSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: false,
    },
    emailIsVerified: {
      type: Boolean,
      default: () => false,
    },

    countryCode: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    mobileIsVerified: {
      type: Boolean,
      default: () => false,
    },

    expiresAt: {
      type: Date,
      default: defaultExpiration,
    },
  },
  { collection: "Account" }
);

/**
 * @typedef {Object} Account
 * @property {string} _id
 * @property {string?} email
 * @property {boolean} emailIsVerified
 * @property {string} countryCode
 * @property {string} mobile
 * @property {boolean} mobileIsVerified
 * @property {Date} expiresAt
 */

module.exports = mongoose.model("Account", AccountSchema, "Account");
