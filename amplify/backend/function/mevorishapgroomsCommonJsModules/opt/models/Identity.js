const mongoose = require("mongoose");
const defaultExpiration = require("../config/defaultExpiration");

const IdentitySchema = new mongoose.Schema(
  {
    accountId: {
      type: String,
      required: true,
      unique: true,
      ref: "Account",
    },

    aadhaarImage: {
      type: String,
      required: false,
    },
    idcardImage: {
      type: String,
      required: false,
    },

    expiresAt: {
      type: Date,
      default: defaultExpiration,
    },
  },
  { collection: "Identity" }
);

/**
 * @typedef {Object} Identity
 * @property {string} _id
 * @property {string} accountId
 * @property {string?} aadhaarImage
 * @property {string?} idcardImage
 * @property {Date} expiresAt
 */

module.exports = mongoose.model("Identity", IdentitySchema, "Identity");
