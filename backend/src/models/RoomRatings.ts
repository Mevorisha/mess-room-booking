import { FirestorePaths } from "@/lib/firebaseAdmin/init";

export interface RoomRatingsData {
  roomId: string;
  ratingOn5: number;
}

function mkCompositeKey(uid: string, roomId: string) {
  return `${uid}:${roomId}`;
}

class RoomRatings {
  /**
   * Add a new log
   */
  static async set(uid: string, roomId: string, rating: number): Promise<void> {
    const docRef = FirestorePaths.RoomRatings().doc(mkCompositeKey(uid, roomId));
    await docRef.set({ roomId, ratingOn5: rating }, { merge: true });
  }

  /**
   * Get log by type and date time range
   */
  static async get(uid: string, roomId: string): Promise<number | null> {
    const ref = FirestorePaths.RoomRatings().doc(mkCompositeKey(uid, roomId));
    const doc = await ref.get();
    if (!doc.exists) return null;
    const data = doc.data() as RoomRatingsData;
    if (!data) return null;
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
      const data = doc.data() as RoomRatingsData;
      if (data && typeof data.ratingOn5 === "number") {
        // Extract uid from the composite key
        const compositeKey = doc.id;
        const uid = compositeKey.split(":")[0];
        result.set(uid, data.ratingOn5);
      }
    });
    return result;
  }

  static async getAvgForRoom(roomId: string): Promise<number> {
    const forRoom = await RoomRatings.getAllForRoom(roomId);
    const len = forRoom.size;
    return Array.from(forRoom.values())
      .filter((v) => 1 <= v && v <= 5) // ignore 0 i.e. unrated
      .reduce((acc, r) => acc + r / len, 0);
  }
}

export default RoomRatings;
