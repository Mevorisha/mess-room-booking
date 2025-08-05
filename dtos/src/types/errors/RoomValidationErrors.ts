export default class RoomValidationErrors {
  // Required field errors
  static readonly ID_REQUIRED = "Room ID is required";
  static readonly OWNER_ID_REQUIRED = "Owner ID is required";
  static readonly LANDMARK_REQUIRED = "Landmark is required";
  static readonly ADDRESS_REQUIRED = "Address is required";
  static readonly CITY_REQUIRED = "City is required";
  static readonly STATE_REQUIRED = "State is required";
  static readonly RATING_REQUIRED = "Rating is required";

  // Enum field errors
  static readonly INVALID_GENDER = "Gender must be MALE, FEMALE, or OTHER";
  static readonly INVALID_OCCUPATION = "Occupation must be STUDENT, PROFESSIONAL, or ANY";

  // Array field errors
  static readonly SEARCH_TAGS_EMPTY = "Search tags cannot be empty";
  static readonly SEARCH_TAGS_NOT_STRING = "All search tags must be strings";
  static readonly MAJOR_TAGS_EMPTY = "Major tags cannot be empty";
  static readonly MINOR_TAGS_EMPTY = "Minor tags cannot be empty";

  // Numeric field errors
  static readonly CAPACITY_POSITIVE = "Capacity must be a positive number";
  static readonly PRICE_POSITIVE = "Price per occupant must be a positive number";

  // Complex field errors
  static readonly IMAGES_INVALID = "Images must be valid photo objects";

  // Timestamp field errors
  static readonly CREATED_ON_INVALID = "Created on must be a valid date string";
  static readonly LAST_MODIFIED_ON_INVALID = "Last modified on must be a valid date string";

  // Optional field errors
  static readonly TTL_INVALID = "TTL must be a valid string";
  static readonly IS_UNAVAILABLE_INVALID = "Is unavailable must be a boolean value";
  static readonly IS_DELETED_INVALID = "Is deleted must be a boolean value";
}
