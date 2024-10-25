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

/**
 * @param {any} error
 */
export function getCleanFirebaseErrMsg(error) {
  if (error.code === "auth/popup-closed-by-user") {
    return "Popup closed by user. Please try again.";
  }
  if (error.code === "auth/user-not-found") {
    return "User not found. Please register.";
  }
  if (error.code === "auth/invalid-credential") {
    return "Invalid credentials. Please try again.";
  }
  if (error.code === "auth/email-already-in-use") {
    return "Email already in use. Please login.";
  }

  let errmsg = error
    .toString()
    .replace(/FirebaseError: Firebase: (.+) \(.+\/.+\)./g, "$1");

  if (!errmsg || errmsg === "Error") {
    const errcode = error.code;
    /* convert errcode from {service}/{error-code} to {Service} error: {Error code} */
    errmsg = errcode.replace(/(.+)\/(.+)/g, "$1 error: $2").replace(/-/g, " ");
    /* upper case 1st char and 1st char after ": " */
    errmsg = errmsg.charAt(0).toUpperCase() + errmsg.slice(1);
    errmsg = errmsg.replace(/: (.)/g, (match) => match.toUpperCase());
  }

  return errmsg;
}
