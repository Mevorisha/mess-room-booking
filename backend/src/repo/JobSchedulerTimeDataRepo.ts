import { FirestorePaths } from "@/firebase/init";

interface JobSchedulerTimeData {
  lastRunTime: number;
}

export class JobSchedulerTimeDataRepo {
  /**
   * Add a new log
   */
  static async set(jobId: string, time: number): Promise<void> {
    const docRef = FirestorePaths.JobScheduler().doc(jobId);
    await docRef.set({ lastRunTime: time }, { merge: true });
  }

  /**
   * Get log by type and date time range
   */
  static async get(jobId: string): Promise<number | null> {
    const ref = FirestorePaths.JobScheduler().doc(jobId);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const data = doc.data() as JobSchedulerTimeData;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
    if (!data) return null;
    return data.lastRunTime;
  }

  /**
   * Get all scheduler times as a Map<jobId, lastRunTime>
   */
  static async getAll(): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    const collRef = FirestorePaths.JobScheduler();
    const snapshot = await collRef.get();
    if (snapshot.empty) return result;
    snapshot.forEach((doc) => {
      const data = doc.data() as JobSchedulerTimeData;
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unnecessary-condition
      if (data && typeof data.lastRunTime === "number") {
        result.set(doc.id, data.lastRunTime);
      }
    });
    return result;
  }
}
