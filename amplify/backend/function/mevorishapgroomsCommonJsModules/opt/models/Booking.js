const mongoose = require("mongoose");
const defaultExpiration = require("../config/defaultExpiration");

const BookingSchema = new mongoose.Schema(
  {
    tenantAccountId: {
      type: String,
      required: true,
      ref: "Account",
    },
    roomId: {
      type: String,
      required: true,
      ref: "Room",
    },
    occupied: {
      type: Number,
      required: true,
    },

    aadhaarUrl: {
      type: String,
      required: false,
    },
    idcardUrl: {
      type: String,
      required: false,
    },

    isAccepted: {
      type: Boolean,
      default: () => false,
    },
    isRevoked: {
      type: Boolean,
      default: () => false,
    },

    expiresAt: {
      type: Date,
      default: defaultExpiration,
    },
  },
  { collection: "Booking" }
);

/**
 * @typedef {Object} Booking
 * @property {string} _id
 * @property {string} tenantAccountId
 * @property {string} roomId
 * @property {number} occupied
 * @property {string?} aadhaarUrl
 * @property {string?} idcardUrl
 * @property {boolean} isAccepted
 * @property {boolean} isRevoked
 * @property {Date} expiresAt
 */

module.exports = mongoose.model("Booking", BookingSchema, "Booking");
