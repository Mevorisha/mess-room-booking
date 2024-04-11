const Joi = require("joi");
const {
  authHeaderTokenSchema,
  authTokenSchema,
  emptySchema,
  emailSchema,
  countryCodeSchema,
  mobileNumberSchema,
  imageSchema,
  firstNameSchema,
  lastNameSchema,
  genderSchema,
  professionSchema,
  dateSchema,
} = require("../common");

const REGISTER = {
  request: {
    body: Joi.alternatives(
      // for ROOM_PROVIDER
      Joi.object().keys({
        email: emailSchema,
        countryCode: countryCodeSchema.required(),
        mobile: mobileNumberSchema.required(),

        profileImage: imageSchema.required(),
        firstName: firstNameSchema.required(),
        lastName: lastNameSchema.required(),
        profileType: Joi.string().valid("ROOM_PROVIDER").required(),
      }),

      // for ROOM_TENANT
      Joi.object().keys({
        email: emailSchema,
        countryCode: countryCodeSchema.required(),
        mobile: mobileNumberSchema.required(),

        profileImage: imageSchema.required(),
        firstName: firstNameSchema.required(),
        lastName: lastNameSchema.required(),
        profileType: Joi.string().valid("ROOM_PROVIDER").required(),

        gender: genderSchema.required(),
        profession: professionSchema.required(),
        roomMateGender: Joi.array().items(genderSchema).required(),
        roomMateProfession: Joi.array().items(professionSchema).required(),
      })
    ),
  },

  response: {
    body: Joi.object().keys({
      otpId: Joi.string().required(),
      expiresAt: dateSchema.required(),
    }),
  },
};

const LOGIN = {
  request: {
    body: Joi.object().keys({
      countryCode: countryCodeSchema.required(),
      mobile: mobileNumberSchema.required(),
    }),
  },

  response: {
    body: Joi.object().keys({
      otpId: Joi.string().required(),
      expiresAt: Joi.date().required(),
    }),
  },
};

const RESEND_OTP = {
  request: {
    body: Joi.object().keys({
      otpId: Joi.string().required(),
    }),
  },

  response: {
    body: Joi.object().keys({
      otpId: Joi.string().required(),
      expiresAt: Joi.date().required(),
    }),
  },
};

const VERIFY_MOBILE_AND_LOGIN = {
  request: {
    body: Joi.object().keys({
      code: Joi.string().required(),
    }),
  },

  response: {
    body: authTokenSchema,
  },
};

const REQUEST_EMAIL_VERIFICATION = {
  request: {
    headers: Joi.object().keys({
      Authorization: authHeaderTokenSchema.required(),
    }),
    body: emptySchema,
  },

  response: {
    body: emptySchema,
  },
};

const VERIFY_EMAIL = {
  request: {
    body: Joi.object().keys({
      code: Joi.string().required(),
    }),
  },

  response: {
    body: emptySchema,
  },
};

const LOGOUT = {
  request: {
    headers: Joi.object().keys({
      Authorization: authHeaderTokenSchema.required(),
    }),
    body: emptySchema,
  },

  response: {
    body: emptySchema,
  },
};

const REFRESH = {
  request: {
    body: Joi.object().keys({
      refreshToken: Joi.string().required(),
    }),
  },

  response: {
    body: authTokenSchema,
  },
};

const authSchema = {
  REGISTER,
  LOGIN,
  RESEND_OTP,
  VERIFY_MOBILE_AND_LOGIN,
  REQUEST_EMAIL_VERIFICATION,
  VERIFY_EMAIL,
  LOGOUT,
  REFRESH,
};

module.exports = authSchema;
