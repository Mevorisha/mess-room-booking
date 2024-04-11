const env = require("../config/env");
const mongoose = require("mongoose");
const { createDate, DateUnits } = require("../config/createDate");

const TokenSchema = new mongoose.Schema(
  {
    accountId: {
      type: String,
      required: true,
      ref: "Account",
    },

    accessToken: {
      type: String,
      required: true,
      unique: true,
    },

    refreshToken: {
      type: String,
      required: true,
      unique: true,
    },

    expiresAt: {
      type: Date,
      default: () => createDate(env.REFRESH_TOKEN_EXPIRATION_TIME_DAYS, DateUnits.DAYS),
    },
  },
  { collection: "Token" }
);

/**
 * @typedef {Object} Token
 * @property {string} _id
 * @property {string} accountId
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {Date} expiresAt
 */

module.exports = mongoose.model("Token", TokenSchema, "Token");
