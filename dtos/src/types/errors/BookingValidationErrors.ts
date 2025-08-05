export default class BookingValidationErrors {
  // Required field errors
  static readonly ID_REQUIRED = "Booking ID is required";
  static readonly TENANT_ID_REQUIRED = "Tenant ID is required";
  static readonly ROOM_ID_REQUIRED = "Room ID is required";

  // Occupant count errors
  static readonly OCCUPANT_COUNT_INVALID = "Occupant count must be a valid number";
  static readonly OCCUPANT_COUNT_POSITIVE = "Occupant count must be a positive number";

  // Optional link field errors
  static readonly LINK_TO_WORK_ID_INVALID = "Link to work ID must be a valid string";
  static readonly LINK_TO_GOV_ID_INVALID = "Link to government ID must be a valid string";

  // Boolean field errors
  static readonly IS_SUBMITTED_INVALID = "Is submitted must be a boolean value";
  static readonly IS_CANCELLED_INVALID = "Is cancelled must be a boolean value";
  static readonly IS_CLEARED_INVALID = "Is cleared must be a boolean value";
  static readonly IS_DELETED_INVALID = "Is deleted must be a boolean value";

  // Enum field errors
  static readonly INVALID_ACCEPTANCE_STATUS = "Acceptance status must be a valid status";

  // Timestamp field errors
  static readonly SUBMITTED_ON_INVALID = "Submitted on must be a valid date string";
  static readonly ACCEPTED_ON_INVALID = "Accepted on must be a valid date string";
  static readonly CANCELLED_ON_INVALID = "Cancelled on must be a valid date string";
  static readonly CLEARED_ON_INVALID = "Cleared on must be a valid date string";
  static readonly CREATED_ON_INVALID = "Created on must be a valid date string";
  static readonly LAST_MODIFIED_ON_INVALID = "Last modified on must be a valid date string";

  // Optional field errors
  static readonly TTL_INVALID = "TTL must be a valid string";
}
