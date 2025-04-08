import { FirestorePaths } from "@/lib/firebaseAdmin/init";

export interface SchedulerTimesData {
  lastRunTime: number;
}

class SchedulerTimes {
  /**
   * Add a new log
   */
  static async set(jobId: string, time: number): Promise<void> {
    const docRef = FirestorePaths.SchedulerTimes().doc(jobId);
    await docRef.set({ lastRunTime: time }, { merge: true });
  }

  /**
   * Get log by type and date time range
   */
  static async get(jobId: string): Promise<number | null> {
    const ref = FirestorePaths.SchedulerTimes().doc(jobId);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const data = doc.data() as SchedulerTimesData;
    if (!data) return null;
    return data.lastRunTime;
  }

  /**
   * Get all scheduler times as a Map<jobId, lastRunTime>
   */
  static async getAll(): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    try {
      const collRef = FirestorePaths.SchedulerTimes();
      const snapshot = await collRef.get();
      if (snapshot.empty) return result;
      snapshot.forEach((doc) => {
        const data = doc.data() as SchedulerTimesData;
        if (data && typeof data.lastRunTime === "number") {
          result.set(doc.id, data.lastRunTime);
        }
      });
    } catch (error) {
      console.error("Error fetching scheduler times:", error);
    }
    return result;
  }
}

export default SchedulerTimes;
