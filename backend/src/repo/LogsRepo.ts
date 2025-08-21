import { FirestorePaths } from "@/firebase/init";
import { DateTimeRange, LogsModel } from "@/models/Logs";
import { ValueOf } from "next/dist/shared/lib/constants";
import { LogType } from "sharedtypes";

export class LogsRepo {
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
  static async get(uid: string, types: LogType[], range?: DateTimeRange): Promise<LogsModel | null> {
    const ref = FirestorePaths.Logs(uid);

    const doc = await ref.get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (data == null) {
      return null;
    }

    let result = {} as LogsModel;
    // If range given, filter, else all
    if (range != null) {
      Object.keys(data).forEach((timestamp) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const messageObj = data[timestamp];
        const messageDate = new Date(timestamp);
        if (messageDate >= range.from && messageDate <= range.to) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          result[timestamp] = messageObj;
        }
      });
    } else {
      result = data;
    }

    // Bkp result
    const bkpResult = result;
    result = {} as LogsModel;

    // If types given, filter, else all
    if (types.length > 0) {
      Object.keys(bkpResult).forEach((timestamp) => {
        const messageObj = bkpResult[timestamp] as ValueOf<LogsModel>;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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