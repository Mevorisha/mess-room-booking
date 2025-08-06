enum IdentityResValidationErrors {
  // Basic field errors
  DISPLAY_NAME_INVALID = "Display name must be a valid string",
  FIRST_NAME_INVALID = "First name must be a valid string",
  LAST_NAME_INVALID = "Last name must be a valid string",
  MOBILE_INVALID = "Mobile number must be a valid string",
  EMAIL_INVALID = "Email must be a valid email address",

  // Enum field errors
  INVALID_IDENTITY_TYPE = "Identity type must be a valid identity type",
  INVALID_LANGUAGE = "Language must be a valid language",

  // Photo field errors
  PROFILE_PHOTOS_INVALID = "Profile photos must be valid photo objects",
  WORK_ID_INVALID = "Work ID photo must be a valid photo object",
  GOV_ID_INVALID = "Government ID photo must be a valid photo object",
  WORK_ID_PRIVATE_INVALID = "Work ID privacy setting must be a boolean value",
  GOV_ID_PRIVATE_INVALID = "Government ID privacy setting must be a boolean value",

  // Timestamp field errors
  CREATED_ON_INVALID = "Created on must be a valid date string",
  LAST_MODIFIED_ON_INVALID = "Last modified on must be a valid date string",

  // Optional field errors
  TTL_INVALID = "TTL must be a valid string",
  IS_DELETED_INVALID = "Is deleted must be a boolean value",
}

export default IdentityResValidationErrors;
