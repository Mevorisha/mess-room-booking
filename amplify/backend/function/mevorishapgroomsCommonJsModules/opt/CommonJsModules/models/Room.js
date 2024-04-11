const mongoose = require("mongoose");
const defaultExpiration = require("../config/defaultExpiration");

const Gender = require("../types/enums/Gender");
const Profession = require("../types/enums/Profession");

const RoomSchema = new mongoose.Schema(
  {
    providerAccountId: {
      type: String,
      required: true,
      ref: "Account",
    },

    geoLocationLat: {
      type: Number,
      required: true,
    },
    geoLocationLon: {
      type: Number,
      required: true,
    },

    imageUrls: {
      type: [String],
      required: true,
    },

    acceptingGender: {
      type: [String],
      // enum: Object.values(Gender),
      required: true,
    },
    acceptingProfession: {
      type: [String],
      // enum: Object.values(Profession),
      required: true,
    },

    aadhaarRequired: {
      type: Boolean,
      required: true,
    },
    idcardRequired: {
      type: Boolean,
      required: true,
    },

    facilities: {
      type: Map,
      of: String,
      required: false,
    },
    pricePerOccupant: {
      type: Number,
      required: true,
    },
    maxOccupants: {
      type: Number,
      required: true,
    },

    expiresAt: {
      type: Date,
      default: defaultExpiration,
    },
  },
  { collection: "Room" }
);

/**
 * @typedef {Object} Room
 * @property {string} _id
 * @property {string} providerAccountId
 * @property {number} geoLocationLat
 * @property {number} geoLocationLon
 * @property {string[]} imageUrls
 * @property {Gender.Types} acceptingGender
 * @property {Profession.Types} acceptingProfession
 * @property {boolean} aadhaarRequired
 * @property {boolean} idcardRequired
 * @property {Map<string, string>} facilities
 * @property {number} pricePerOccupant
 * @property {number} maxOccupants
 * @property {Date} expiresAt
 */

module.exports = mongoose.model("Room", RoomSchema, "Room");
