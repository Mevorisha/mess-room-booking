import { CustomApiError } from "@/lib/utils/ApiError";
import Logs from "@/models/Logs";

export function logToDb(e: Error) {
  if (e instanceof CustomApiError && e.status === 500) {
    Logs.put("[InternalServerError]", {
      timestamp: new Date().toUTCString(),
      message: String(e),
      type: "error",
    }).catch((e) => console.error("[E] [LogToDb]", e));
  }
}
