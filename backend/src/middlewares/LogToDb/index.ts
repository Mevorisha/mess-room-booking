import { CustomApiError } from "@/types/CustomApiError";
import Logs from "@/models/Logs";

export async function logToDb(e: Error): Promise<Error> {
  if (e instanceof CustomApiError && 400 <= e.status && e.status <= 499) {
    return e; 
  }
  await Logs.put("[InternalServerError]", {
    timestamp: new Date().toUTCString(),
    message: String(e),
    type: "error",
  }).catch((e) => console.error("[E] [LogToDb]", e));
  return e;
}
