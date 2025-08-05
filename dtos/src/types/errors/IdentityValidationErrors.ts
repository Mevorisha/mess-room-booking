export default class IdentityValidationErrors {
  // Basic field errors
  static readonly DISPLAY_NAME_INVALID = "Display name must be a valid string";
  static readonly FIRST_NAME_INVALID = "First name must be a valid string";
  static readonly LAST_NAME_INVALID = "Last name must be a valid string";
  static readonly MOBILE_INVALID = "Mobile number must be a valid string";
  static readonly EMAIL_INVALID = "Email must be a valid email address";

  // Enum field errors
  static readonly INVALID_IDENTITY_TYPE = "Identity type must be a valid identity type";
  static readonly INVALID_LANGUAGE = "Language must be a valid language";

  // Photo field errors
  static readonly PROFILE_PHOTOS_INVALID = "Profile photos must be valid photo objects";
  static readonly WORK_ID_INVALID = "Work ID photo must be a valid photo object";
  static readonly GOV_ID_INVALID = "Government ID photo must be a valid photo object";
  static readonly WORK_ID_PRIVATE_INVALID = "Work ID privacy setting must be a boolean value";
  static readonly GOV_ID_PRIVATE_INVALID = "Government ID privacy setting must be a boolean value";

  // Timestamp field errors
  static readonly CREATED_ON_INVALID = "Created on must be a valid date string";
  static readonly LAST_MODIFIED_ON_INVALID = "Last modified on must be a valid date string";

  // Optional field errors
  static readonly TTL_INVALID = "TTL must be a valid string";
  static readonly IS_DELETED_INVALID = "Is deleted must be a boolean value";
}
