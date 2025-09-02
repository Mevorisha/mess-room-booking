import { FirestorePaths } from "@/firebase/init";
import { FirebaseFirestore } from "@/firebase/init";
import { RoomRepo } from "@/repo/RoomRepo";
import { RoomRatingsService } from "@/services/Room/RoomRatingsService";

export async function updateRoomRatings(): Promise<void> {
  const collRef = FirebaseFirestore.collection(FirestorePaths.ROOMS);
  const snapshot = await collRef.get();
  if (snapshot.empty) return;
  const updatePromises: Promise<void>[] = [];
  snapshot.forEach((doc) => {
    const roomId = doc.id;
    const mkUpdatePromise = async () => {
      const avgRating = await RoomRatingsService.getAvgForRoom(roomId);
      await RoomRepo.update(roomId, { rating: avgRating });
    };
    updatePromises.push(mkUpdatePromise());
  });
  return void Promise.all(updatePromises);
}
