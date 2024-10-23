/**
 * @enum {string}
 */
const ErrorMessages = {
    USER_NOT_LOGGED_IN: "User is not logged in.",
    REGISTRATION_UNSUPPORTED: "Resgitration is not supported.",
    REGISTRATION_FAILED: "Registration failed. Please try again.",
    LOGIN_FAILED: "Login failed. Please try again.",
    LOGOUT_FAILED: "Logout failed. Please try again.",
    LOGGING_FAILED: "Logging to remote server failed.",
    DATA_READ_FAILED: "Error reading data from the database.",
    DATA_WRITE_FAILED: "Error writing data to the database.",
    DATA_UPDATE_FAILED: "Error updating data in the database.",
    DATA_DELETE_FAILED: "Error deleting data from the database.",
    UNKNOWN_ERROR: "An unknown error occurred.",
};

export default ErrorMessages;
