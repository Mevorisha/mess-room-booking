import { fbRtdbGetRef, RtDbPaths } from "./init.js";
import { set } from "firebase/database";
import ErrorMessages from "../errors/ErrorMessages.js"

/**
 * @param {string} operation
 * @param {string} descrip
 * @param {string} code
 */
async function logInfo(operation, descrip, code = "code_unknown") {
  try {
    const timestamp = new Date().toISOString();
    const uid = localStorage.getItem("uid") || "user_logged_out";
    const logRef = fbRtdbGetRef(RtDbPaths.LOGS, timestamp);
    await set(logRef, `I: ${uid}: ${operation}: ${code}: ${descrip}`);
  } catch (error) {
    console.error(ErrorMessages.LOGGING_FAILED, error);
  }
}

/**
 * @param {string} operation
 * @param {string} descrip
 * @param {string} code
 */
async function logError(operation, descrip, code = "code_unknown") {
  try {
    const timestamp = new Date().toISOString();
    const uid = localStorage.getItem("uid") || "user_logged_out";
    const logRef = fbRtdbGetRef(RtDbPaths.LOGS, timestamp);
    await set(logRef, `E: ${uid}: ${operation}: ${code}: ${descrip}`);
  } catch (error) {
    console.error(ErrorMessages.LOGGING_FAILED, error);
  }
}

export { logInfo, logError };
