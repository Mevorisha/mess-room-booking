const env = require("../config/env");

const ProviderProfileModel = require("../models/ProviderProfile");
const TenantProfileModel = require("../models/TenantProfile");
const RoomModel = require("../models/Room");
const BookingModel = require("../models/Booking");
const Gender = require("../types/enums/Gender");
const Profession = require("../types/enums/Profession");

/**
 * @typedef {Object} ContactInfo
 * @property {string} countryCode
 * @property {string} mobile
 */

/**
 * @typedef {ProviderProfileModel.ProviderProfile & ContactInfo} ProviderProfileWithContact
 * @typedef {TenantProfileModel.TenantProfile & ContactInfo} TenantProfileWithContact
 */

const RoomError = {
  ROOM_NOT_FOUND: "RoomModel:ROOM_NOT_FOUND",
  ROOM_PROVIDER_NOT_FOUND: "RoomModel:ROOM_PROVIDER_NOT_FOUND",
};

/**
 * @param {string} providerAccountId
 * @param {number} geoLocationLat
 * @param {number} geoLocationLon
 * @param {string[]} imageUrls
 * @param {Gender.Types} acceptingGender
 * @param {Profession.Types} acceptingProfession
 * @param {boolean} aadhaarRequired
 * @param {boolean} idcardRequired
 * @param {Map<string, string>?} facilities
 * @param {number} pricePerOccupant
 * @param {number} maxOccupants
 * @returns {Promise<RoomModel.Room>}
 */
async function createRoom(
  providerAccountId,
  geoLocationLat,
  geoLocationLon,
  imageUrls,
  acceptingGender,
  acceptingProfession,
  aadhaarRequired,
  idcardRequired,
  facilities,
  pricePerOccupant,
  maxOccupants
) {
  return RoomModel.create({
    providerAccountId,
    geoLocationLat,
    geoLocationLon,
    imageUrls,
    acceptingGender,
    acceptingProfession,
    aadhaarRequired,
    idcardRequired,
    facilities,
    pricePerOccupant,
    maxOccupants,
  });
}

/**
 * @param {RoomModel.Room | string} room Room model object or room ID
 * @param {string[]} imageUrls
 * @returns {Promise<void>}
 */
async function addImages(room, imageUrls) {
  const roomId = typeof room === "string" ? room : room._id;
  await RoomModel.updateOne(
    { _id: roomId },
    { $push: { imageUrls: { $each: imageUrls } } }
  );
}

/**
 * @param {RoomModel.Room | string} room Room model object or room ID
 * @param {string[]} imageUrls
 * @returns {Promise<void>}
 */
async function removeImages(room, imageUrls) {
  const roomId = typeof room === "string" ? room : room._id;
  await RoomModel.updateOne(
    { _id: roomId },
    { $pull: { imageUrls: { $each: imageUrls } } }
  );
}

/**
 * @param {RoomModel.Room | string} room Room model object or room ID
 * @returns {Promise<ProviderProfileWithContact>}
 */
async function getProviderProfile(room) {
  const roomId = typeof room === "string" ? room : room._id;

  const query = [
    // lookup room collection and create a new field called rooms
    {
      $lookup: {
        from: "Room",
        localField: "accountId",
        foreignField: "providerAccountId",
        as: "rooms",
      },
    },
    { $unwind: "$rooms" },

    // filter the rooms by the roomId
    {
      $match: {
        "rooms._id": roomId,
      },
    },

    // lookup account collection and create a new field called contact
    {
      $lookup: {
        from: "Account",
        localField: "accountId",
        foreignField: "_id",
        as: "contact",
      },
    },
    { $unwind: "$contact" },

    // hide the rooms field and account details
    {
      $project: {
        rooms: 0,
        "contact._id": 0,
        "contact.email": 0,
        "contact.emailIsVerified": 0,
        "contact.mobileIsVerified": 0,
        "contact.expiresAt": 0,
      },
    },
  ];

  const profiles = ProviderProfileModel.aggregate(query).exec();
  if (profiles.length === 0) {
    throw new Error(RoomError.ROOM_PROVIDER_NOT_FOUND);
  }

  return profiles[0];
}

/**
 * @param {RoomModel.Room | string} room Room model object or room ID
 * @returns {Promise<TenantProfileWithContact[]>}
 */
async function getTenantProfiles(room) {
  const roomId = typeof room === "string" ? room : room._id;

  const query = [
    // lookup booking collection and create a new field called bookings
    {
      $lookup: {
        from: "Booking",
        localField: "accountId",
        foreignField: "tenantAccountId",
        as: "bookings",
      },
    },
    { $unwind: "$bookings" },

    // filter the bookings by the roomId
    {
      $match: {
        "bookings.roomId": roomId,
      },
    },

    // lookup account collection and create a new field called contact
    {
      $lookup: {
        from: "Account",
        localField: "accountId",
        foreignField: "_id",
        as: "contact",
      },
    },
    { $unwind: "$contact" },

    // hide the bookings field and account details
    {
      $project: {
        bookings: 0,
        "contact._id": 0,
        "contact.email": 0,
        "contact.emailIsVerified": 0,
        "contact.mobileIsVerified": 0,
        "contact.expiresAt": 0,
      },
    },
  ];

  return TenantProfileModel.aggregate(query).exec();
}

/**
 * @param {RoomModel.Room | string} room Room model object or room ID
 * @returns {Promise<BookingModel.Booking[]>}
 */
async function getBookings(room) {
  const roomId = typeof room === "string" ? room : room._id;
  return BookingModel.find({ roomId });
}

/**
 * @param {RoomModel.Room | string} room Room model object or room ID
 * @returns {Promise<number>}
 */
async function getOccupied(room) {
  const roomId = typeof room === "string" ? room : room._id;
  return BookingModel.find({ roomId }).then((bookings) => {
    return bookings.reduce((acc, booking) => acc + booking.occupied, 0);
  });
}

/**
 * @param {RoomModel.Room | string} room Room model object or room ID
 * @returns {Promise<number>}
 */
async function getEmpty(room) {
  /**
   * @type {RoomModel.Room}
   */
  const roomDoc =
    typeof room !== "string" ? room : await RoomModel.findOne({ _id: room });

  const occupied = getOccupied(room);
  return occupied.then((occupied) => roomDoc.maxOccupants - occupied);
}

/**
 * @param {RoomModel.Room | string} room Room model object or room ID
 * @returns {Promise<void>}
 */
async function markForDeletion(room) {
  const roomId = typeof room === "string" ? room : room._id;

  const days = env.DELETION_WAIT_TIME_DAYS;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await RoomModel.updateOne({ _id: roomId }, { $set: { expiresAt } });
}

/**
 * @returns {Promise<void>}
 */
async function deleteExpired() {
  await RoomModel.deleteMany({ expiresAt: { $lt: new Date() } });
}

/**
 * @typedef {Object} RoomStatics
 * @property {() => Promise<BookingModel[]>} getBookings
 * @property {() => Promise<number>} getOccupied
 * @property {() => Promise<number>} getEmpty
 */

module.exports = {
  RoomError,
  createRoom,
  addImages,
  removeImages,
  getProviderProfile,
  getTenantProfiles,
  getBookings,
  getOccupied,
  getEmpty,
  markForDeletion,
  deleteExpired,
};
