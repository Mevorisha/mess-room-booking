import { FirestorePaths } from "@/lib/firebaseAdmin/init";
import { FirebaseFirestore } from "@/lib/firebaseAdmin/init";
import Room from "@/models/Room";
import RoomRatings from "@/models/RoomRatings";

export async function updateRoomRatings() {
  const collRef = FirebaseFirestore.collection(FirestorePaths.ROOMS);
  const snapshot = await collRef.get();
  if (snapshot.empty) return;
  const updatePromises: Promise<void>[] = [];
  snapshot.forEach((doc) => {
    const roomId = doc.id;
    const mkUpdatePromise = async () => {
      const avgRating = await RoomRatings.getAvgForRoom(roomId);
      await Room.update(roomId, { rating: avgRating });
    };
    updatePromises.push(mkUpdatePromise());
  });
  return Promise.all(updatePromises);
}
