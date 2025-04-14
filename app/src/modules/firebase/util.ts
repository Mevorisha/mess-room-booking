import ErrorMessages from "@/modules/errors/ErrorMessages.js";
import { ApiPaths, apiPostOrPatchJson } from "@/modules/util/api.js";

async function logInfo(operation: string, descrip: string, code = "code_unknown"): Promise<void> {
  const uid = localStorage.getItem("uid") ?? "user_logged_out";
  const message = `I: ${uid}: ${operation}: ${code}: ${descrip}`;
  console.log(message);
  try {
    const timestamp = new Date().toUTCString();
    await apiPostOrPatchJson("POST", ApiPaths.Logs.put("info"), { timestamp, message });
  } catch (error) {
    console.error(ErrorMessages.LOGGING_FAILED, error);
  }
}

async function logError(operation: string, descrip: string, code = "code_unknown"): Promise<void> {
  const uid = localStorage.getItem("uid") ?? "user_logged_out";
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
