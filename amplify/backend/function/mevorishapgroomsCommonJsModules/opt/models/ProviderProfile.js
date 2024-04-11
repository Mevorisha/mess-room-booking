const mongoose = require("mongoose");
const defaultExpiration = require("../config/defaultExpiration");
const ProfileTypes = require("../types/enums/ProfileTypes");

const providerProfileSchema = new mongoose.Schema(
  {
    accountId: {
      type: String,
      required: true,
      unique: true,
      ref: "Account",
    },

    profileImage: {
      type: String,
      required: true,
    },

    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      default: () => ProfileTypes.ROOM_PROVIDER,
    },

    expiresAt: {
      type: Date,
      default: defaultExpiration,
    },
  },
  { collection: "ProviderProfile" }
);

/**
 * @typedef {Object} ProviderProfile
 * @property {string} _id
 * @property {string} accountId
 * @property {string} profileImage
 * @property {string} firstName
 * @property {string} lastName
 * @property {"ROOM_PROVIDER"} type
 * @property {Date} expiresAt
 */

module.exports = mongoose.model(
  "ProviderProfile",
  providerProfileSchema,
  "ProviderProfile"
);
