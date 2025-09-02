import { FirestorePaths } from "@/firebase/init";
import { RoomRatingsModel } from "@/models/Room";
import { UNKNOWN_STR } from "sharedtypes";

function mkCompositeKey(uid: string, roomId: string) {
  return `${uid}:${roomId}`;
}

export class RoomRatingsService {
  /**
   * Add a new log
   */
  static async set(uid: string, roomId: string, rating: number): Promise<void> {
    const docRef = FirestorePaths.RoomRatings().doc(mkCompositeKey(uid, roomId));
    await docRef.set({ roomId, ratingOn5: rating });
  }

  /**
   * Get log by type and date time range
   */
  static async get(uid: string, roomId: string): Promise<number | null> {
    const ref = FirestorePaths.RoomRatings().doc(mkCompositeKey(uid, roomId));
    const doc = await ref.get();
    if (!doc.exists) return null;
    const data = doc.data() as RoomRatingsModel | null;
    if (data == null) return null;
    return data.ratingOn5;
  }

  /**
   * Get all room ratings for a specific room
   * @param roomId - The ID of the room to get ratings for
   * @returns Map of uid to rating
   */
  static async getAllForRoom(roomId: string): Promise<Map<string, number>> {
    const result = new Map<string, number>();
    const collRef = FirestorePaths.RoomRatings();
    // Query all ratings where roomId matches the given roomId
    const snapshot = await collRef.where("roomId", "==", roomId).get();
    if (snapshot.empty) return result;
    snapshot.forEach((doc) => {
      const data = doc.data() as RoomRatingsModel | null;
      if (data != null && typeof data.ratingOn5 === "number") {
        // Extract uid from the composite key
        const compositeKey = doc.id;
        const uid = compositeKey.split(":")[0] ?? UNKNOWN_STR;
        result.set(uid, data.ratingOn5);
      }
    });
    return result;
  }

  static async getAvgForRoom(roomId: string): Promise<number> {
    // Only include valid ratings (1-5)
    // Coz:  0 ratings   -> unrated ratings if counted will reduce rating result
    //       More than 5 -> invalid
    const ratings = Array.from((await RoomRatingsService.getAllForRoom(roomId)).values()).filter(
      (v) => 1 <= v && v <= 5
    );
    if (ratings.length === 0) return 0;
    return ratings.reduce((acc, r) => acc + r, 0) / ratings.length;
  }
}
