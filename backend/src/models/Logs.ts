import { FirestorePaths } from "@/firebase/init";
import { ValueOf } from "next/dist/shared/lib/constants";

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

    await docRef.set({ [timestamp]: { message, type } }, { merge: true });
  }

  /**
   * Get log by type and date time range
   */
  static async get(uid: string, types: LogType[], range?: DateTimeRange): Promise<LogData | null> {
    const ref = FirestorePaths.Logs(uid);

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

    // If types given, filter, else all
    if (types.length > 0) {
      Object.keys(bkpResult).forEach((timestamp) => {
        const messageObj = bkpResult[timestamp] as ValueOf<LogData>;
        const messageType = messageObj?.type ?? "error";
        if (types.includes(messageType as LogType)) {
          result[timestamp] = messageObj;
        }
      });
    } else {
      result = bkpResult;
    }

    return result;
  }
}

export default Logs;
