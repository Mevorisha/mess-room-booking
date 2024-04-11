const env = require("../config/env");

const IdentityModel = require("../models/Identity");
const BookingModel = require("../models/Booking");
const RoomModel = require("../models/Room");
const RoomService = require("../services/Room");
const IdentityService = require("../services/Identity");

const BookingError = {
  BOOKING_NOT_FOUND: "BookingModel:BOOKING_NOT_FOUND",
  BOOKING_DOCS_NOT_SATISFIED: "BookingModel:BOOKING_DOCS_NOT_SATISFIED",
  BOOKING_PROVIDER_NOT_FOUND: "BookingModel:BOOKING_PROVIDER_NOT_FOUND",
  BOOKING_TENANT_NOT_FOUND: "BookingModel:BOOKING_TENANT_NOT_FOUND",
  BOOKING_REVOKED: "BookingModel:BOOKING_REVOKED",
};

/**
 * @param {string} tenantAccountId
 * @param {string} roomId
 * @param {boolean} occupied
 * @returns {Promise<BookingModel.Booking>}
 */
async function createBooking(tenantAccountId, roomId, occupied) {
  /** @type {IdentityModel.Identity} */
  const tenantIdentityDoc = await IdentityModel.findOne({
    accountId: tenantAccountId,
  });

  if (!tenantIdentityDoc) {
    throw new Error(IdentityService.IdentityError.IDENTITY_NOT_FOUND);
  }

  /** @type {RoomModel.Room} */
  const roomDoc = await RoomModel.findOne({ _id: roomId });
  if (!roomDoc) {
    throw new Error(RoomService.RoomError.ROOM_NOT_FOUND);
  }

  const aadhaarRequired = roomDoc.aadhaarRequired;
  const idcardRequired = roomDoc.idcardRequired;

  return BookingModel.create({
    tenantAccountId,
    roomId,
    occupied,
    // autp pull the aadhaar and idcard images from tenant's identity
    aadhaarUrl: aadhaarRequired ? tenantIdentityDoc.aadhaarImage : null,
    idcardUrl: idcardRequired ? tenantIdentityDoc.idcardImage : null,
  });
}

/**
 * Auto-pull documents once the user has uploaded them to his identity model
 * @param {BookingModel.Booking | string} booking Booking model object or booking ID
 * @returns {Promise<void>}
 */
async function updateDocs(booking) {
  /** @type {BookingModel.Booking} */
  const bookingDoc =
    typeof booking === "string"
      ? await BookingModel.findOne({ _id: booking })
      : booking;

  if (!bookingDoc) {
    throw new Error(BookingError.BOOKING_NOT_FOUND);
  }
  if (bookingDoc.isRevoked) {
    throw new Error(BookingError.BOOKING_REVOKED);
  }

  /** @type {IdentityModel.Identity} */
  const tenantIdentityDoc = await IdentityModel.findOne({
    accountId: bookingDoc.tenantAccountId,
  });

  if (!tenantIdentityDoc) {
    throw new Error(IdentityService.IdentityError.IDENTITY_NOT_FOUND);
  }

  /** @type {RoomModel.Room} */
  const roomDoc = await RoomModel.findOne({ _id: bookingDoc.roomId });
  if (!roomDoc) {
    throw new Error(RoomService.RoomError.ROOM_NOT_FOUND);
  }

  const aadhaarRequired = roomDoc.aadhaarRequired;
  const idcardRequired = roomDoc.idcardRequired;

  bookingDoc.aadhaarUrl = aadhaarRequired
    ? tenantIdentityDoc.aadhaarImage
    : null;

  bookingDoc.idcardUrl = idcardRequired ? tenantIdentityDoc.idcardImage : null;

  // @ts-ignore
  await bookingDoc.save();
}

/**
 * @param {BookingModel.Booking | string} booking Booking model object or booking ID
 * @returns {Promise<RoomService.ProviderProfileWithContact>}
 */
async function getProviderProfile(booking) {
  const bookingDoc =
    typeof booking === "string"
      ? await BookingModel.findOne({ _id: booking })
      : booking;

  if (!bookingDoc) {
    throw new Error(BookingError.BOOKING_NOT_FOUND);
  }

  let profile = null;
  try {
    profile = RoomService.getProviderProfile(bookingDoc.roomId);
  } catch (err) {
    if (err.message === RoomService.RoomError.ROOM_PROVIDER_NOT_FOUND) {
      throw new Error(BookingError.BOOKING_PROVIDER_NOT_FOUND);
    } else {
      throw err;
    }
  }

  return profile;
}

/**
 * @param {BookingModel.Booking | string} booking Booking model object or booking ID
 * @returns {Promise<RoomService.TenantProfileWithContact[]>}
 */
async function getTenantProfile(booking) {
  const bookingDoc =
    typeof booking === "string"
      ? await BookingModel.findOne({ _id: booking })
      : booking;

  if (!bookingDoc) {
    throw new Error(BookingError.BOOKING_NOT_FOUND);
  }

  let profiles = null;
  try {
    profiles = RoomService.getTenantProfiles(bookingDoc.tenantAccountId);
  } catch (err) {
    throw new Error(BookingError.BOOKING_TENANT_NOT_FOUND);
  }

  return profiles;
}

/**
 * @param {BookingModel.Booking | string} booking Booking model object or booking ID
 * @returns {Promise<boolean>}
 */
async function areDocsSatisfied(booking) {
  const bookingDoc =
    typeof booking === "string"
      ? await BookingModel.findOne({ _id: booking })
      : booking;

  if (!bookingDoc) {
    throw new Error(BookingError.BOOKING_NOT_FOUND);
  }

  const roomDoc = await RoomModel.find({ _id: bookingDoc.roomId });
  if (roomDoc.length === 0) {
    throw new Error(RoomService.RoomError.ROOM_NOT_FOUND);
  }

  return Boolean(
    (!roomDoc.aadhaarRequired || bookingDoc.aadhaarUrl) &&
      (!roomDoc.idcardRequired || bookingDoc.idcardUrl)
  );
}

/**
 * @param {BookingModel.Booking | string} booking Booking model object or booking ID
 * @returns {Promise<{
 *   aadhaarUrl?: string,
 *   idcardUrl?: string,
 * }>}
 */
async function getDocuments(booking) {
  const bookingDoc =
    typeof booking === "string"
      ? await BookingModel.findOne({ _id: booking })
      : booking;

  if (!bookingDoc) {
    throw new Error(BookingError.BOOKING_NOT_FOUND);
  }

  return {
    aadhaarUrl: bookingDoc.aadhaarUrl,
    idcardUrl: bookingDoc.idcardUrl,
  };
}

/**
 * @param {BookingModel.Booking | string} booking Booking model object or booking ID
 * @returns {Promise<RoomModel.Room>}
 */
async function getRoom(booking) {
  const bookingId = typeof booking === "string" ? booking : booking._id;

  const query = [
    // lookup booking collection and create a new field called booking
    {
      $lookup: {
        from: "Booking",
        localField: "_id",
        foreignField: "roomId",
        as: "booking",
      },
    },
    { $unwind: "$booking" },

    // filter the bookings by the bookingId
    {
      $match: {
        "booking._id": bookingId,
      },
    },

    // hide the booking field
    {
      $project: {
        booking: 0,
      },
    },
  ];

  const rooms = await RoomModel.aggregate(query).exec();
  if (rooms.length === 0) {
    throw new Error(BookingError.BOOKING_NOT_FOUND);
  }

  return rooms[0];
}

/**
 * @param {BookingModel.Booking | string} booking Booking model object or booking ID
 * @returns {Promise<void>}
 */
async function acceptBooking(booking) {
  const bookingId = typeof booking === "string" ? booking : booking._id;
  const bookingDoc = await BookingModel.findOne({ _id: bookingId });

  if (!bookingDoc) {
    throw new Error(BookingError.BOOKING_NOT_FOUND);
  }

  const accepted = await areDocsSatisfied(bookingDoc);
  if (!accepted) {
    throw new Error(BookingError.BOOKING_DOCS_NOT_SATISFIED);
  }

  bookingDoc.isAccepted = true;
  await bookingDoc.save();
}

/**
 * @param {BookingModel.Booking | string} booking Booking model object or booking ID
 * @returns {Promise<void>}
 */
async function revokeBooking(booking) {
  const bookingId = typeof booking === "string" ? booking : booking._id;
  await BookingModel.updateOne({ _id: bookingId }, { isRevoked: true });
}

/**
 * @returns {Promise<void>}
 */
async function deleteExpired() {
  await BookingModel.deleteMany({ expiresAt: { $lt: new Date() } });
}

module.exports = {
  createBooking,
  updateDocs,
  getProviderProfile,
  getTenantProfile,
  areDocsSatisfied,
  getDocuments,
  getRoom,
  acceptBooking,
  revokeBooking,
  deleteExpired,
};

module.exports = BookingModel;
