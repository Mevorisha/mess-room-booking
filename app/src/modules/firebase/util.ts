import ErrorMessages from "@/modules/errors/ErrorMessages.js";
import { ApiPaths, apiPostOrPatchJson } from "@/modules/util/api.js";
import { HttpMethodTypes, LogPostReqBodyDTO, LogType } from "sharedtypes";

/**
 * @throws {DtoValidationError | Error}
 */
async function logInfo(operation: string, descrip: string, code = "code_unknown"): Promise<void> {
  const uid = localStorage.getItem("uid") ?? "user_logged_out";
  const message = `I: ${uid}: ${operation}: ${code}: ${descrip}`;
  console.log(message);
  try {
    const timestamp = new Date().toUTCString();
    // Throw error so that it is handled in the promise chain rather than resolving here as success
    await apiPostOrPatchJson(HttpMethodTypes.POST, ApiPaths.Logs.put(LogType.INFO), LogPostReqBodyDTO.create({ timestamp, message }).unwrapOrThrow()); // prettier-ignore
  } catch (error) {
    console.error(ErrorMessages.LOGGING_FAILED, error);
  }
}

/**
 * @throws {DtoValidationError | Error}
 */
async function logError(operation: string, descrip: string, code = "code_unknown"): Promise<void> {
  const uid = localStorage.getItem("uid") ?? "user_logged_out";
  const message = `E: ${uid}: ${operation}: ${code}: ${descrip}`;
  console.error(message);
  try {
    const timestamp = new Date().toUTCString();
    // Throw error so that it is handled in the promise chain rather than resolving here as success
    await apiPostOrPatchJson(HttpMethodTypes.POST, ApiPaths.Logs.put(LogType.ERROR), LogPostReqBodyDTO.create({ timestamp, message }).unwrapOrThrow()); // prettier-ignore
  } catch (error) {
    console.error(ErrorMessages.LOGGING_FAILED, error);
  }
}

export { logInfo, logError };
