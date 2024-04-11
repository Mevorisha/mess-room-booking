const env = require("../config/env");
const OtpType = require("../types/enums/OtpType");
const AccountModel = require("../models/Account");
const AccountService = require("../services/Account");
const OtpModel = require("../models/OTP");

const crypto = require("crypto");

const OtpError = {
  OTP_EXPIRED: "OtpModel:OTP_EXPIRED",
  OTP_INVALID: "OtpModel:OTP_INVALID",
};

/**
 * @returns {string}
 */
function otpGenerator() {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

/**
 * @param {string} accountId
 * @param {OtpType.Types} type
 * @returns {Promise<OtpModel.OTP>}
 */
async function createOTP(accountId, type) {
  const account = await AccountModel.findOne({ _id: accountId });
  if (!account) {
    throw new Error(AccountService.AccountError.ACCOUNT_NOT_FOUND);
  }

  const code = otpGenerator();
  const expiresAt = new Date(
    Date.now() + env.OTP_EXPIRATION_TIME_MINUTES * 60 * 1000
  );
  return OtpModel.create({ accountId, code, type, expiresAt });
}

/**
 * Verify the code, delete if valid, and return the account
 * @param {string} code
 * @returns {Promise<AccountModel.Account>}
 */
async function verifyCode(code) {
  const otp = await OtpModel.findOne({ code });
  if (!otp) {
    throw new Error(OtpError.OTP_INVALID);
  }
  if (otp.expiresAt < new Date()) {
    throw new Error(OtpError.OTP_EXPIRED);
  }

  const accountId = otp.accountId;
  await OtpModel.deleteOne({ _id: otp._id });
  return AccountModel.findOne({ _id: accountId });
}

/**
 * @returns {Promise<void>}
 */
async function deleteExpired() {
  await OtpModel.deleteMany({ expiresAt: { $lt: new Date() } });
}

module.exports = {
  OtpError,
  createOTP,
  verifyCode,
  deleteExpired,
};
