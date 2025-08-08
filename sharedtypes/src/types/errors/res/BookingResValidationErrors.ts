export enum BookingResValidationErrors {
  // Required field errors
  ID_REQUIRED = "Booking ID is required",
  TENANT_ID_REQUIRED = "Tenant ID is required",
  ROOM_ID_REQUIRED = "Room ID is required",

  // Occupant count errors
  OCCUPANT_COUNT_INVALID = "Occupant count must be a valid number",
  OCCUPANT_COUNT_POSITIVE = "Occupant count must be a positive number",

  // Optional link field errors
  LINK_TO_WORK_ID_INVALID = "Link to work ID must be a valid string",
  LINK_TO_GOV_ID_INVALID = "Link to government ID must be a valid string",

  // Boolean field errors
  IS_SUBMITTED_INVALID = "Is submitted must be a boolean value",
  IS_CANCELLED_INVALID = "Is cancelled must be a boolean value",
  IS_CLEARED_INVALID = "Is cleared must be a boolean value",
  IS_DELETED_INVALID = "Is deleted must be a boolean value",

  // Enum field errors
  INVALID_ACCEPTANCE_STATUS = "Acceptance status must be a valid status",

  // Timestamp field errors
  SUBMITTED_ON_INVALID = "Submitted on must be a valid date string",
  ACCEPTED_ON_INVALID = "Accepted on must be a valid date string",
  CANCELLED_ON_INVALID = "Cancelled on must be a valid date string",
  CLEARED_ON_INVALID = "Cleared on must be a valid date string",
  CREATED_ON_INVALID = "Created on must be a valid date string",
  LAST_MODIFIED_ON_INVALID = "Last modified on must be a valid date string",

  // Optional field errors
  TTL_INVALID = "TTL must be a valid string",
}
