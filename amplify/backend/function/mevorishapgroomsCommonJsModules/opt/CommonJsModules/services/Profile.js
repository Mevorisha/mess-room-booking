const env = require("../config/env");
const Gender = require("../types/enums/Gender");
const Profession = require("../types/enums/Profession");
const getLocationName = require("../util/getLocationName");
const ProviderProfileModel = require("../models/ProviderProfile");
const TenantProfileModel = require("../models/TenantProfile");
const AccountModel = require("../models/Account");
const AccountService = require("../services/Account");

const ProfileError = {
  PROFILE_NOT_FOUND: "ProfileModel:PROFILE_NOT_FOUND",
  EXPECTED_PROVIDER_PROFILE: "ProfileModel:EXPECTED_PROVIDER_PROFILE",
  EXPECTED_TENANT_PROFILE: "ProfileModel:EXPECTED_TENANT_PROFILE",
};

/**
 * @param {string} accountId
 * @param {string} profileImage
 * @param {string} firstName
 * @param {string} lastName
 * @returns {Promise<ProviderProfileModel.ProviderProfile>}
 */
async function createProviderProfile(
  accountId,
  profileImage,
  firstName,
  lastName
) {
  const account = await AccountModel.findOne({ _id: accountId });
  if (!account) {
    throw new Error(AccountService.AccountError.ACCOUNT_NOT_FOUND);
  }

  return ProviderProfileModel.create({
    accountId,
    profileImage,
    firstName,
    lastName,
  });
}

/**
 * @param {string} accountId
 * @param {string} profileImage
 * @param {string} firstName
 * @param {string} lastName
 * @param {Gender.Types} gender
 * @param {Profession.Types} profession
 * @param {Gender.Types[]} roomMateGender
 * @param {Profession.Types[]} roomMateProfession
 */
async function createTenantProfile(
  accountId,
  profileImage,
  firstName,
  lastName,
  gender,
  profession,
  roomMateGender,
  roomMateProfession
) {
  const account = await AccountModel.findOne({ _id: accountId });
  if (!account) {
    throw new Error(AccountService.AccountError.ACCOUNT_NOT_FOUND);
  }

  return TenantProfileModel.create({
    accountId,
    profileImage,
    firstName,
    lastName,
    gender,
    profession,
    roomMateGender,
    roomMateProfession,
  });
}

/**
 * @param {ProviderProfileModel.ProviderProfile | string} profile
 * @param {{
 *   profileImage?: string,
 *   firstName?: string,
 *   lastName?: string,
 * }} updateOptions
 * @returns {Promise<ProviderProfileModel.ProviderProfile>}
 */
async function updateProviderProfile(profile, updateOptions) {
  const updates = Object.entries(updateOptions).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  });

  const profileId = typeof profile === "string" ? profile : profile._id;

  const complementProfile = await TenantProfileModel.findOne({
    _id: profileId,
  });

  if (complementProfile) {
    throw new Error(ProfileError.EXPECTED_PROVIDER_PROFILE);
  }

  return ProviderProfileModel.updateOne({ _id: profileId }, { $set: updates });
}

/**
 * @param {TenantProfileModel.TenantProfile | string} profile
 * @param {{
 *   profileImage?: string,
 *   firstName?: string,
 *   lastName?: string,
 *   gender?: Gender.Types,
 *   profession?: Profession.Types,
 *   roomMateGender?: Gender.Types[],
 *   roomMateProfession?: Profession.Types[],
 * }} updateOptions
 * @returns {Promise<TenantProfileModel.TenantProfile>}
 */
async function updateTenantProfile(profile, updateOptions) {
  const updates = Object.entries(updateOptions).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  });

  const profileId = typeof profile === "string" ? profile : profile._id;

  const complementProfile = await ProviderProfileModel.findOne({
    _id: profileId,
  });

  if (complementProfile) {
    throw new Error(ProfileError.EXPECTED_TENANT_PROFILE);
  }

  return TenantProfileModel.updateOne({ _id: profileId }, { $set: updates });
}

/**
 * @param {TenantProfileModel.TenantProfile | string} profile Tenant profile object or ID
 * @returns {Promise<{ name: string, lat: number, lon: number }[]>}
 */
async function getTenantJobLocations(profile) {
  const profileId = typeof profile === "string" ? profile : profile._id;

  const tenantProfile = await TenantProfileModel.findOne({ _id: profileId });
  return tenantProfile.jobLocations;
}

/**
 * @param {TenantProfileModel.TenantProfile | string} profile Tenant profile object or ID
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<void>}
 */
async function addTenantJobLocation(profile, lat, lon) {
  const profileId = typeof profile === "string" ? profile : profile._id;

  const name = await getLocationName(lat, lon);

  await TenantProfileModel.updateOne(
    { _id: profileId },
    { $push: { jobLocations: { name, lat, lon } } }
  );
}

/**
 * @param {TenantProfileModel.TenantProfile | string} profile Tenant profile object or ID
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<void>}
 */
async function removeTenantJobLocation(profile, lat, lon) {
  const profileId = typeof profile === "string" ? profile : profile._id;

  await TenantProfileModel.updateOne(
    { _id: profileId },
    { $pull: { jobLocations: { lat, lon } } }
  );
}

async function deleteExpired() {
  await ProviderProfileModel.deleteMany({ expiresAt: { $lt: new Date() } });
  await TenantProfileModel.deleteMany({ expiresAt: { $lt: new Date() } });
}

module.exports = {
  ProfileError,
  createProviderProfile,
  createTenantProfile,
  updateProviderProfile,
  updateTenantProfile,
  getTenantJobLocations,
  addTenantJobLocation,
  removeTenantJobLocation,
  deleteExpired,
};
