enum RoomResValidationErrors {
  // Required field errors
  ID_REQUIRED = "Room ID is required",
  OWNER_ID_REQUIRED = "Owner ID is required",
  LANDMARK_REQUIRED = "Landmark is required",
  ADDRESS_REQUIRED = "Address is required",
  CITY_REQUIRED = "City is required",
  STATE_REQUIRED = "State is required",
  RATING_REQUIRED = "Rating is required",

  // Enum field errors
  INVALID_GENDER = "Gender must be MALE, FEMALE, or OTHER",
  INVALID_OCCUPATION = "Occupation must be STUDENT, PROFESSIONAL, or ANY",

  // Array field errors
  SEARCH_TAGS_EMPTY = "Search tags cannot be empty",
  SEARCH_TAGS_NOT_STRING = "All search tags must be strings",
  MAJOR_TAGS_EMPTY = "Major tags cannot be empty",
  MINOR_TAGS_EMPTY = "Minor tags cannot be empty",

  // Numeric field errors
  CAPACITY_POSITIVE = "Capacity must be a positive number",
  PRICE_POSITIVE = "Price per occupant must be a positive number",

  // Complex field errors
  IMAGES_INVALID = "Images must be valid photo objects",

  // Timestamp field errors
  CREATED_ON_INVALID = "Created on must be a valid date string",
  LAST_MODIFIED_ON_INVALID = "Last modified on must be a valid date string",

  // Optional field errors
  TTL_INVALID = "TTL must be a valid string",
  IS_UNAVAILABLE_INVALID = "Is unavailable must be a boolean value",
  IS_DELETED_INVALID = "Is deleted must be a boolean value",
}

export default RoomResValidationErrors;
