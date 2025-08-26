import { FirebaseStorage, FirestorePaths, StoragePaths } from "@/firebase/init";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { CustomApiError } from "@/types/CustomApiError";
import { BookingSearchService } from "@/services/Booking/BookingSearchService";

export class RoomService {
  static async markForDelete(roomId: string): Promise<number> {
    if (await RoomService.hasBooking(roomId)) {
      throw CustomApiError.create(409, "Room is in use");
    }
    const daysToLive = 30;
    const ref = FirestorePaths.Rooms(roomId);
    const ttl = Timestamp.fromDate(new Date(Date.now() + daysToLive * 24 * 60 * 60 * 1000));
    try {
      // Throws error if room doesn't exist
      await ref.update({ ttl, lastModifiedOn: FieldValue.serverTimestamp() });
    } catch (e) {
      throw CustomApiError.create(404, "Room not found", e);
    }
    return daysToLive;
  }

  static async unmarkForDelete(roomId: string): Promise<void> {
    const ref = FirestorePaths.Rooms(roomId);
    try {
      // Throws error if room doesn't exist
      await ref.update({ ttl: FieldValue.delete(), lastModifiedOn: FieldValue.serverTimestamp() });
    } catch (e) {
      throw CustomApiError.create(404, "Room not found", e);
    }
  }

  static async forceDelete(roomId: string): Promise<void> {
    if (await RoomService.hasBooking(roomId)) {
      throw CustomApiError.create(409, "Room is in use");
    }
    const ref = FirestorePaths.Rooms(roomId);
    // delete the db entry
    await ref.delete();
    // delete all the images under the roomId
    await FirebaseStorage.bucket().deleteFiles({ prefix: StoragePaths.RoomPhotos.gsBucket(roomId) });
  }

  static async setUnavailability(roomId: string, isUnavailable: boolean): Promise<void> {
    if (await RoomService.hasBooking(roomId)) {
      throw CustomApiError.create(409, "Room is in use");
    }
    const ref = FirestorePaths.Rooms(roomId);
    try {
      // Throws error if room doesn't exist
      await ref.update({ isUnavailable, lastModifiedOn: FieldValue.serverTimestamp() });
    } catch (e) {
      throw CustomApiError.create(404, "Room not found", e);
    }
  }

  /**
   * Check if a room has any active bookings
   * @param roomId The ID of the room to check
   * @returns Promise<boolean> True if the room has any active bookings
   */
  static async hasBooking(roomId: string): Promise<boolean> {
    // Query for bookings with this roomId that are not cancelled and not cleared
    const bookings = await BookingSearchService.queryAll({ type: "ROOM", roomId });

    // If we found any bookings, the room has active bookings
    return bookings.filter((b) => !b.isCancelled && !b.isCleared).length > 0;
  }
}
