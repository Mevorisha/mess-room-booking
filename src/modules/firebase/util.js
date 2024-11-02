import { fbRtdbGetRef, RtDbPaths } from "./init.js";
import { set } from "firebase/database";
import ErrorMessages, {
  getCleanFirebaseErrMsg,
} from "../errors/ErrorMessages.js";

/**
 * @param {string} operation
 * @param {string} descrip
 * @param {string} code
 */
async function logInfo(operation, descrip, code = "code_unknown") {
  const uid = localStorage.getItem("uid") || "user_logged_out";
  try {
    const timestamp = new Date().toUTCString();
    const logRef = fbRtdbGetRef(RtDbPaths.LOGS, timestamp);
    await set(logRef, `I: ${uid}: ${operation}: ${code}: ${descrip}`);
  } catch (error) {
    console.error(`I: ${uid}: ${operation}: ${code}: ${descrip}`);
    console.error(ErrorMessages.LOGGING_FAILED, getCleanFirebaseErrMsg(error));
  }
}

/**
 * @param {string} operation
 * @param {string} descrip
 * @param {string} code
 */
async function logError(operation, descrip, code = "code_unknown") {
  const uid = localStorage.getItem("uid") || "user_logged_out";
  console.error(`I: ${uid}: ${operation}: ${code}: ${descrip}`);
  try {
    const timestamp = new Date().toUTCString();
    const logRef = fbRtdbGetRef(RtDbPaths.LOGS, timestamp);
    await set(logRef, `E: ${uid}: ${operation}: ${code}: ${descrip}`);
  } catch (error) {
    console.error(ErrorMessages.LOGGING_FAILED, getCleanFirebaseErrMsg(error));
  }
}

export { logInfo, logError };
