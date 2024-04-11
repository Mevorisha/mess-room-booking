const mongoose = require("mongoose");
const defaultExpiration = require("../config/defaultExpiration");
const Gender = require("../types/enums/Gender");
const Profession = require("../types/enums/Profession");
const ProfileTypes = require("../types/enums/ProfileTypes");

const tenantProfileSchema = new mongoose.Schema(
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
      default: () => ProfileTypes.ROOM_TENANT,
    },

    gender: {
      type: String,
      enum: Object.values(Gender),
      required: true,
    },
    profession: {
      type: String,
      enum: Object.values(Profession),
      required: true,
    },

    roomMateGender: {
      type: [String],
      // enum: Object.values(Gender),
      required: true,
    },
    roomMateProfession: {
      type: [String],
      // enum: Object.values(Profession),
      required: true,
    },

    jobLocations: {
      type: [
        {
          name: String,
          lat: Number,
          lon: Number,
        },
      ],
      default: () => [],
    },

    expiresAt: {
      type: Date,
      default: defaultExpiration,
    },
  },
  { collection: "TenantProfile" }
);

/**
 * @typedef {Object} TenantProfile
 * @property {string} _id
 * @property {string} accountId
 * @property {string} profileImage
 * @property {string} firstName
 * @property {string} lastName
 * @property {"ROOM_TENANT"} type
 * @property {Gender.Types} gender
 * @property {Profession.Types} profession
 * @property {Gender.Types[]} roomMateGender
 * @property {Profession.Types[]} roomMateProfession
 * @property {{
 *   name: string,
 *   lat: number,
 *   lon: number,
 * }[]} jobLocations
 * @property {Date} expiresAt
 */

module.exports = mongoose.model(
  "TenantProfile",
  tenantProfileSchema,
  "TenantProfile"
);
