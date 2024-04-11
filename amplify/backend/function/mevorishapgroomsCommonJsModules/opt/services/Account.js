const env = require("../config/env");
const AccountModel = require("../models/Account");
const RoomModel = require("../models/Room");
const BookingModel = require("../models/Booking");
const IdentityModel = require("../models/Identity");
const ProviderProfileModel = require("../models/ProviderProfile");
const TenantProfileModel = require("../models/TenantProfile");

const AccountError = {
  ACCOUNT_NOT_FOUND: "AccountModel:ACCOUNT_NOT_FOUND",
};

/**
 * @typedef {Object} IdentityAndProfile
 * @property {IdentityModel.Identity} identity
 * @property {(ProviderProfileModel.ProviderProfile | TenantProfileModel.TenantProfile)[]} profile
 *
 * @typedef {AccountModel.Account & IdentityAndProfile} AccountPopulated
 */

/**
 * @param {string?} email
 * @param {string} countryCode
 * @param {string} mobile
 * @returns {Promise<AccountModel.Account>}
 */
async function createAccount(email, countryCode, mobile) {
  return AccountModel.create({
    email,
    countryCode,
    mobile,
  });
}

/**
 * @param {string} countryCode
 * @param {string} mobile
 * @returns {Promise<AccountModel.Account>}
 */
async function findByMobile(countryCode, mobile) {
  return AccountModel.findOne({ countryCode, mobile });
}

/**
 * @param {string} countryCode
 * @param {string} mobile
 * @returns {Promise<AccountPopulated>}
 */
async function findByMobileAndPopulate(countryCode, mobile) {
  const query = [
    // match the account by countryCode and mobile
    {
      $match: {
        $and: [{ countryCode }, { mobile }],
      },
    },

    // lookup identity collection and create a new field called identity
    {
      $lookup: {
        from: "Identity",
        localField: "_id",
        foreignField: "accountId",
        as: "identity",
      },
    },

    // unwind the identity array to get the object
    { $unwind: "$identity" },

    // lookup providerprofile collection and create a new field called providerProfile
    {
      $lookup: {
        from: "ProviderProfile",
        localField: "_id",
        foreignField: "accountId",
        as: "providerProfile",
      },
    },

    // lookup tenantprofile collection and create a new field called tenantProfile
    {
      $lookup: {
        from: "TenantProfile",
        localField: "_id",
        foreignField: "accountId",
        as: "tenantProfile",
      },
    },

    // combine the providerProfile and tenantProfile arrays into a single array called profile
    {
      $addFields: {
        profile: {
          $concatArrays: ["$providerProfile", "$tenantProfile"],
        },
      },
    },

    // hide the providerProfile and tenantProfile fields
    {
      $project: {
        providerProfile: 0,
        tenantProfile: 0,
      },
    },
  ];

  const accounts = AccountModel.aggregate(query).exec();
  if (accounts.length === 0) {
    throw new Error(AccountError.ACCOUNT_NOT_FOUND);
  }

  return accounts[0];
}

/**
 * Only updates fields that are provided in data
 * @param {string} countryCode
 * @param {string} mobile
 * @param {{
 *   email?: string,
 *   countryCode?: string,
 *   mobile?: string,
 * }} data
 * @returns {Promise<void>}
 */
async function updateNotNull(countryCode, mobile, data) {
  const updates = Object.entries(data).reduce((acc, [key, value]) => {
    if (value) acc[key] = value;
    return acc;
  }, {});

  await AccountModel.findOneAndUpdate(
    { countryCode, mobile },
    { $set: updates }
  );
}

/**
 * @param {string} countryCode
 * @param {string} mobile
 * @returns {Promise<RoomModel.Room[]>}
 */
async function roomsProvided(countryCode, mobile) {
  const query = [
    // lookup account collection and create a new field called account
    {
      $lookup: {
        from: "Account",
        localField: "providerAccountId",
        foreignField: "_id",
        as: "account",
      },
    },

    // match the account by countryCode and mobile
    {
      $match: {
        "account.countryCode": countryCode,
        "account.mobile": mobile,
      },
    },

    // hide the account field
    {
      $project: {
        account: 0,
      },
    },
  ];

  return RoomModel.aggregate(query).exec();
}

/**
 * @param {string} countryCode
 * @param {string} mobile
 * @returns {Promise<BookingModel.Booking[]>}
 */
async function bookingsMade(countryCode, mobile) {
  const query = [
    // lookup account collection and create a new field called account
    {
      $lookup: {
        from: "Account",
        localField: "tenantAccountId",
        foreignField: "_id",
        as: "account",
      },
    },

    // match the account by countryCode and mobile
    {
      $match: {
        "account.countryCode": countryCode,
        "account.mobile": mobile,
      },
    },

    // hide the account field
    {
      $project: {
        account: 0,
      },
    },
  ];

  return BookingModel.aggregate(query).exec();
}

/**
 * @param {string} email
 * @returns {Promise<void>}
 */
async function markEmailAsVerified(email) {
  await AccountModel.updateMany({ email }, { emailIsVerified: true });
}

/**
 * @param {string} countryCode
 * @param {string} mobile
 * @returns {Promise<void>}
 */
async function markMobileAsVerified(countryCode, mobile) {
  await AccountModel.updateMany(
    { countryCode, mobile },
    { mobileIsVerified: true }
  );
}

/**
 * @param {string} countryCode
 * @param {string} mobile
 * @returns {Promise<void>}
 */
async function markForDeletion(countryCode, mobile) {
  const days = env.DELETION_WAIT_TIME_DAYS;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  return AccountModel.updateMany({ countryCode, mobile }, { expiresAt });
}

/**
 * @returns {Promise<void>}
 */
async function deleteExpired() {
  const expiredAccounts = await AccountModel.find({
    expiresAt: { $lt: new Date() },
  });
  const expiredAccountIds = expiredAccounts.map((account) => account._id);

  const promises = [
    // delete all the accounts that have expired
    AccountModel.deleteMany({ _id: { $in: expiredAccountIds } }),
    // delete all the identities whose accounts have expired
    IdentityModel.deleteMany({ accountId: { $in: expiredAccountIds } }),
    // delete all the provider profiles whose accounts have expired
    ProviderProfileModel.deleteMany({
      accountId: { $in: expiredAccountIds },
    }),
    // delete all the tenant profiles whose accounts have expired
    TenantProfileModel.deleteMany({
      accountId: { $in: expiredAccountIds },
    }),
    // delete all the rooms whose provider accounts have expired
    RoomModel.deleteMany({
      providerAccountId: { $in: expiredAccountIds },
    }),
    // delete all the bookings whose tenant accounts have expired
    BookingModel.deleteMany({
      tenantAccountId: { $in: expiredAccountIds },
    }),
  ];

  await Promise.allSettled(promises);
}

module.exports = {
  AccountError,
  createAccount,
  findByMobile,
  findByMobileAndPopulate,
  updateNotNull,
  roomsProvided,
  bookingsMade,
  markEmailAsVerified,
  markMobileAsVerified,
  markForDeletion,
  deleteExpired,
};
