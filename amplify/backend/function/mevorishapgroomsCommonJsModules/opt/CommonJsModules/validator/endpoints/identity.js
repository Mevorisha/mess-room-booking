const Joi = require("joi");
const {
  authHeaderTokenSchema,
  countryCodeSchema,
  mobileNumberSchema,
  imageSchema,
  emptySchema,
} = require("../common");

const GET_COUNTRYCODE_MOBILE = {
  request: {
    headers: Joi.object().keys({
      Authorization: authHeaderTokenSchema.required(),
    }),

    query: Joi.object().keys({
      countryCode: countryCodeSchema.required(),
      mobile: mobileNumberSchema.required(),
    }),
  },

  response: {
    body: Joi.object().keys({
      idcard: imageSchema,
      aadhaar: imageSchema,
    }),
  },
};

const PUT_IDENTITY_IDCARD = {
  request: {
    headers: Joi.object().keys({
      Authorization: authHeaderTokenSchema.required(),
    }),

    body: imageSchema,
  },

  response: {
    body: emptySchema,
  },
};

const PUT_IDENTITY_AADHAAR = {
  request: {
    headers: Joi.object().keys({
      Authorization: authHeaderTokenSchema.required(),
    }),

    body: imageSchema,
  },

  response: {
    body: emptySchema,
  },
};

const identitySchema = {
  GET_COUNTRYCODE_MOBILE,
  PUT_IDENTITY_IDCARD,
  PUT_IDENTITY_AADHAAR,
};

module.exports = identitySchema;
