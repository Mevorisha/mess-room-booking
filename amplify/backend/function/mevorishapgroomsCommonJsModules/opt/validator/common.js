const Joi = require("joi");
const Gender = require("../types/enums/Gender");
const Profession = require("../types/enums/Profession");
const ProfileTypes = require("../types/enums/ProfileTypes");

const emptySchema = Joi.object().keys({});

const authHeaderTokenSchema = Joi.string().pattern(/^Bearer .+$/);

const authTokenSchema = Joi.object().keys({
  access: Joi.object()
    .keys({
      token: Joi.string().required(),
      expiresAt: Joi.date().required(),
    })
    .required(),
  refresh: Joi.object()
    .keys({
      token: Joi.string().required(),
      expiresAt: Joi.date().required(),
    })
    .required(),
});

const mimeImageSchema = Joi.string().pattern(/^image\/.+$/);
const fileDataSchema = Joi.string().base64();
const dateSchema = Joi.date();

const firstNameSchema = Joi.string().pattern(/^[A-Z][a-z]+$/);
const lastNameSchema = Joi.string().pattern(/^[A-Z][a-z]+$/);

const genderSchema = Joi.string().valid(Object.values(Gender));
const professionSchema = Joi.string().valid(Object.values(Profession));

const emailSchema = Joi.string().email();
const countryCodeSchema = Joi.string().pattern(/^\+[0-9]+$/);
const mobileNumberSchema = Joi.string().pattern(/^[0-9]+$/);

const imageSchema = Joi.object().keys({
  mime: mimeImageSchema.required(),
  data: fileDataSchema.required(),
});

const profileTypeSchema = Joi.string().valid(Object.values(ProfileTypes));

const locationSchema = Joi.object().keys({
  name: Joi.string().required(),
  lat: Joi.number().required(),
  lon: Joi.number().required(),
});

module.exports = {
  emptySchema,
  authHeaderTokenSchema,
  authTokenSchema,
  mimeImageSchema,
  fileDataSchema,
  dateSchema,
  firstNameSchema,
  lastNameSchema,
  genderSchema,
  professionSchema,
  emailSchema,
  countryCodeSchema,
  mobileNumberSchema,
  imageSchema,
  profileTypeSchema,
  locationSchema,
};
