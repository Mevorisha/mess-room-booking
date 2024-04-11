const Joi = require("joi");
const {
  authHeaderTokenSchema,
  emptySchema,
  imageSchema,
  firstNameSchema,
  lastNameSchema,
  genderSchema,
  professionSchema,
  locationSchema,
} = require("../common");

const GET_PROFILE = {
  request: {
    headers: Joi.object().keys({
      Authorization: authHeaderTokenSchema.required(),
    }),
    body: emptySchema,
  },

  response: {
    body: Joi.alternatives(
      // for ROOM_PROVIDER
      Joi.object().keys({
        profileImage: imageSchema.required(),
        firstName: firstNameSchema.required(),
        lastName: lastNameSchema.required(),
        type: Joi.string().valid("ROOM_PROVIDER").required(),
      }),

      // for ROOM_TENANT
      Joi.object().keys({
        profileImage: imageSchema.required(),
        firstName: firstNameSchema.required(),
        lastName: lastNameSchema.required(),
        type: Joi.string().valid("ROOM_PROVIDER").required(),

        gender: genderSchema.required(),
        profession: professionSchema.required(),
        roomMateGender: Joi.array().items(genderSchema).required(),
        roomMateProfession: Joi.array().items(professionSchema).required(),

        jobLocations: Joi.array().items(locationSchema).required(),
      })
    ),
  },
};

const GET_PROFILE_JOB_LOCATION = {
  request: {
    headers: Joi.object().keys({
      Authorization: authHeaderTokenSchema.required(),
    }),

    query: Joi.object().keys({
      lat: Joi.number().required(),
      lon: Joi.number().required(),
    }),
  },

  response: {
    body: Joi.object().keys({
      name: Joi.string().required(),
    }),
  },
};

const PUT_PROFILE_JOB_LOCATION = {
  request: {
    headers: Joi.object().keys({
      Authorization: authHeaderTokenSchema.required(),
    }),

    body: Joi.object().keys({
      lat: Joi.number().required(),
      lon: Joi.number().required(),
    }),
  },

  response: {
    body: Joi.object().keys({
      name: Joi.string().required(),
    }),
  },
};

const DELETE_PROFILE_JOB_LOCATION = {
  request: {
    headers: Joi.object().keys({
      Authorization: authHeaderTokenSchema.required(),
    }),

    query: Joi.object().keys({
      lat: Joi.number().required(),
      lon: Joi.number().required(),
    }),
  },

  response: {
    body: emptySchema,
  },
};

const profileSchema = {
  GET_PROFILE,
  GET_PROFILE_JOB_LOCATION,
  PUT_PROFILE_JOB_LOCATION,
  DELETE_PROFILE_JOB_LOCATION,
};

module.exports = profileSchema;
