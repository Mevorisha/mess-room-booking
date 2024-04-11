const IdentityModel = require("../models/Identity");

const IdentityError = {
  IDENTITY_NOT_FOUND: "IdenityModel:IDENTITY_NOT_FOUND",
};

/**
 * @param {string?} aadhaarUrl
 * @param {string?} idcardUrl
 * @returns {Promise<IdentityModel.Identity>}
 */
async function createIdentity(aadhaarUrl, idcardUrl) {
  return IdentityModel.create({
    aadhaarImage: aadhaarUrl,
    idcardImage: idcardUrl,
  });
}

/**
 * @param {IdentityModel.Identity | string} identity Identity model object or identity ID
 * @param {string} aadhaarUrl
 * @returns {Promise<void>}
 */
async function updateAadhaar(identity, aadhaarUrl) {
  const identityId = typeof identity === "string" ? identity : identity._id;
  await IdentityModel.updateOne(
    { _id: identityId },
    { aadhaarImage: aadhaarUrl }
  );
}

/**
 * @param {IdentityModel.Identity | string} identity Identity model object or identity ID
 * @param {string} idcardUrl
 * @returns {Promise<void>}
 */
async function updateIdcard(identity, idcardUrl) {
  const identityId = typeof identity === "string" ? identity : identity._id;
  await IdentityModel.updateOne(
    { _id: identityId },
    { idcardImage: idcardUrl }
  );
}

/**
 * @returns {Promise<void>}
 */
async function deleteExpired() {
  await IdentityModel.deleteMany({ expiresAt: { $lt: new Date() } });
}

module.exports = {
  IdentityError,
  createIdentity,
  updateAadhaar,
  updateIdcard,
  deleteExpired,
};
