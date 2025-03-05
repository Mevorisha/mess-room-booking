import { FirestorePaths } from "@/lib/firebaseAdmin/init";
import { ApiError } from "@/lib/utils/ApiError";

export type LogType = "info" | "error" | "warn";
export type DateTimeRange = { from: Date; to: Date };

export interface LogData {
  [timestamp: string]: {
    message: string;
    type: string;
  };
}

class Logs {
  /**
   * Add a new log
   */
  static async put(uid: string, log: { timestamp: string; message: string; type: LogType }): Promise<void> {
    const docRef = FirestorePaths.Logs(uid);
    const { type, timestamp, message } = log;
    try {
      await docRef.set({ [timestamp]: { message, type } }, { merge: true });
    } catch (e) {
      return Promise.reject(ApiError.create(500, e.message));
    }
  }

  /**
   * Get log by type and date time range
   */
  static async get(uid: string, types: LogType[], range?: DateTimeRange): Promise<LogData | null> {
    const ref = FirestorePaths.Logs(uid);
    try {
      const doc = await ref.get();
      if (!doc.exists) {
        return null;
      }
      const data = doc.data();
      if (!data) {
        return null;
      }

      let result = {} as LogData;
      // If range given, filter, else all
      if (range) {
        Object.keys(data).forEach((timestamp) => {
          const messageObj = data[timestamp];
          const messageDate = new Date(timestamp);
          if (messageDate >= range.from && messageDate <= range.to) {
            result[timestamp] = messageObj;
          }
        });
      } else {
        result = data;
      }

      // Bkp result
      const bkpResult = result;
      result = {} as LogData;
      // If types give, filter, else all
      if (types.length > 0) {
        Object.keys(bkpResult).forEach((timestamp) => {
          const messageObj = bkpResult[timestamp];
          const messageType = messageObj.type;
          if (types.includes(messageType as LogType)) {
            result[timestamp] = messageObj;
          }
        });
      } else {
        result = bkpResult;
      }

      return result;
    } catch (e) {
      return Promise.reject(ApiError.create(500, e.message));
    }
  }
}

export default Logs;
