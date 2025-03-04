import ErrorMessages from "../errors/ErrorMessages.js";
import { ApiPaths, apiPostOrPatchJson } from "../util/api.js";

/**
 * @param {string} operation
 * @param {string} descrip
 * @param {string} code
 */
async function logInfo(operation, descrip, code = "code_unknown") {
  const uid = localStorage.getItem("uid") || "user_logged_out";
  const message = `I: ${uid}: ${operation}: ${code}: ${descrip}`;
  console.log(message);
  try {
    const timestamp = new Date().toUTCString();
    await apiPostOrPatchJson("POST", ApiPaths.Logs.put("info"), { timestamp, message });
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
  const uid = localStorage.getItem("uid") || "user_logged_out";
  const message = `E: ${uid}: ${operation}: ${code}: ${descrip}`;
  console.error(message);
  try {
    const timestamp = new Date().toUTCString();
    await apiPostOrPatchJson("POST", ApiPaths.Logs.put("error"), { timestamp, message });
  } catch (error) {
    console.error(ErrorMessages.LOGGING_FAILED, error);
  }
}

export { logInfo, logError };
