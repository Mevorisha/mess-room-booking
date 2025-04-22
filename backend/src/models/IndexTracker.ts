import { FirestorePaths } from "@/lib/firebaseAdmin/init";

export interface IndexTrackerData {
  flag: boolean;
}

class IndexTracker {
  /**
   * Add a new log
   */
  static async put(trackingKey: string): Promise<void> {
    const docRef = FirestorePaths.IndexTracker().doc(trackingKey);
    await docRef.set({ flag: true }, { merge: true });
  }

  /**
   * Get log by type and date time range
   */
  static async has(trackingKey: string): Promise<boolean> {
    const ref = FirestorePaths.IndexTracker().doc(trackingKey);
    const doc = await ref.get();
    if (!doc.exists) return false;
    const data = doc.data() as IndexTrackerData;
    if (!data) return false;
    return data.flag;
  }

  /**
   * Remove index tracker
   */
  static async remove(trackingKey: string): Promise<void> {
    const docRef = FirestorePaths.IndexTracker().doc(trackingKey);
    await docRef.delete();
  }
}

export default IndexTracker;
