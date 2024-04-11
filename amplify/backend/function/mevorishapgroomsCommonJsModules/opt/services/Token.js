const AccountModel = require("../models/Account");
const TokenModel = require("../models/Token");

const jwt = require("jsonwebtoken");
const env = require("../config/env");
const objPropertyPicker = require("../util/objPropertyPicker");

const TokenError = {
  ACCESS_TOKEN_EXPIRED: "TokenModel:ACCESS_TOKEN_EXPIRED",
  REFRESH_TOKEN_EXPIRED: "TokenModel:REFRESH_TOKEN_EXPIRED",
  ACCESS_TOKEN_INVALID: "TokenModel:ACCESS_TOKEN_INVALID",
  REFRESH_TOKEN_INVALID: "TokenModel:REFRESH_TOKEN_INVALID",
  ACCOUNT_NOT_FOUND: "TokenModel:ACCOUNT_NOT_FOUND",
};

/**
 * @param {AccountModel.Account} account
 * @returns {Object}
 */
function getPayload(account) {
  return objPropertyPicker(account, [
    "_id",
    "email",
    "emailIsVerified",
    "countryCode",
    "mobile",
    "mobileIsVerified",
    "identityId",
    "profileId",
    "expiresAt",
  ]);
}

/**
 * @param {AccountModel.Account} account
 * @returns {Promise<TokenModel.Token>}
 */
async function createToken(account) {
  const payload = getPayload(account);

  const accessTokenExpiresAt = new Date(
    Date.now() + env.ACCESS_TOKEN_EXPIRATION_TIME_DAYS * 24 * 60 * 60 * 1000
  );
  const refreshTokenExpiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_EXPIRATION_TIME_DAYS * 24 * 60 * 60 * 1000
  );

  const accessToken = jwt.sign(
    {
      payload,
      exp: accessTokenExpiresAt.getTime() / 1000,
    },
    env.JWT_ACCESS_TOKEN_SECRET
  );

  const refreshToken = jwt.sign(
    {
      payload,
      exp: refreshTokenExpiresAt.getTime() / 1000,
    },
    env.JWT_REFRESH_TOKEN_SECRET
  );

  const token = new TokenModel({
    accountId: account._id,
    accessToken,
    refreshToken,
    expiresAt: refreshTokenExpiresAt,
  });

  await token.save();
  return token;
}

/**
 * @param {string} accessToken
 * @returns {Promise<AccountModel.Account>}
 */
async function authorizeAccessToken(accessToken) {
  const { payload, exp } = /** @type {jwt.JwtPayload} */ (
    jwt.verify(accessToken, env.JWT_ACCESS_TOKEN_SECRET)
  );

  if (!payload?._id || !exp) {
    throw new Error(TokenError.ACCESS_TOKEN_INVALID);
  }

  if (exp * 1000 < Date.now()) {
    throw new Error(TokenError.ACCESS_TOKEN_EXPIRED);
  }

  const account = await AccountModel.findOne({ _id: payload._id });
  if (!account) {
    throw new Error(TokenError.ACCOUNT_NOT_FOUND);
  }

  return account;
}

/**
 * @param {string} refreshToken
 * @returns {Promise<TokenModel.Token>}
 */
async function regenrateAccessToken(refreshToken) {
  const { originalPayload, exp } = /** @type {jwt.JwtPayload} */ (
    jwt.verify(refreshToken, env.JWT_REFRESH_TOKEN_SECRET)
  );

  if (!originalPayload?._id || !exp) {
    throw new Error(TokenError.REFRESH_TOKEN_INVALID);
  }

  if (exp * 1000 < Date.now()) {
    throw new Error(TokenError.REFRESH_TOKEN_EXPIRED);
  }

  // re-fetch account to make sure updates are reflected in the new token
  const account = await AccountModel.findOne({ _id: originalPayload._id });
  if (!account) {
    throw new Error(TokenError.ACCOUNT_NOT_FOUND);
  }

  const payload = getPayload(account);
  const accessToken = jwt.sign(
    {
      payload,
      exp:
        new Date(
          Date.now() +
            env.ACCESS_TOKEN_EXPIRATION_TIME_DAYS * 24 * 60 * 60 * 1000
        ).getTime() / 1000,
    },
    env.JWT_ACCESS_TOKEN_SECRET
  );

  return TokenModel.findOneAndUpdate({ refreshToken }, { accessToken });
}

/**
 * @param {string} token Access token or refresh token
 * @returns {Promise<void>}
 */
async function revokeToken(token) {
  const tokenDoc = await TokenModel.findOne({
    $or: [{ accessToken: token }, { refreshToken: token }],
  });
  if (!tokenDoc) return;
  await tokenDoc.remove();
}

/**
 * @returns {Promise<void>}
 */
async function deleteExpired() {
  return TokenModel.deleteMany({
    expiresAt: { $lt: new Date() },
  });
}

module.exports = {
  TokenError,
  createToken,
  authorizeAccessToken,
  regenrateAccessToken,
  revokeToken,
  deleteExpired,
};
