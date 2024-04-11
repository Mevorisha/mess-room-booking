const env = require("../config/env");
const mongoose = require("mongoose");
const OtpType = require("../types/enums/OtpType");
const { createDate, DateUnits } = require("../config/createDate");

const OtpSchema = new mongoose.Schema(
  {
    accountId: {
      type: String,
      required: true,
      ref: "Account",
    },
    code: {
      type: String,
      required: true,
      private: true,
      unique: true,
    },
    type: {
      type: String,
      enum: Object.values(OtpType),
      required: true,
    },
    expiresAt: {
      type: Date,
      default: () => createDate(env.OTP_EXPIRATION_TIME_MINUTES, DateUnits.MIN),
    },
  },
  { collection: "OTP" }
);

/**
 * @typedef {Object} OTP
 * @property {string} _id
 * @property {string} accountId
 * @property {string} code
 * @property {OtpType} type
 * @property {Date} expiresAt
 */

module.exports = mongoose.model("OTP", OtpSchema, "OTP");
