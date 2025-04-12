import { CustomApiError } from "@/lib/utils/ApiError";
import Logs from "@/models/Logs";

export function logToDb(e: Error) {
  if (e instanceof CustomApiError && 400 <= e.status && e.status <= 499) {
    return;
  }
  Logs.put("[InternalServerError]", {
    timestamp: new Date().toUTCString(),
    message: String(e),
    type: "error",
  }).catch((e) => console.error("[E] [LogToDb]", e));
}
