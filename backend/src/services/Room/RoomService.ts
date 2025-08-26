import { FirebaseStorage, FirestorePaths } from "@/firebase/init";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { CustomApiError } from "@/types/CustomApiError";
import { BookingSearchService } from "@/services/Booking/BookingSearchService";
import { RoomRepo } from "@/repo/RoomRepo";
import { ApiResponseUrlType } from "sharedtypes";

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
    const roomModel = await RoomRepo.findById(roomId, ApiResponseUrlType.GS_PATH);
    if (roomModel == null) {
      throw CustomApiError.create(404, "Room not found");
    }
    const { images } = roomModel;
    const allImages = images.map((img) => [img.small, img.medium, img.large]).flat();
    try {
      await ref.delete();
    } catch (e) {
      throw CustomApiError.create(500, "Internal Server Error", e);
    }
    // delete all the images
    const deletionResults = await Promise.allSettled(
      allImages.map((gsPath) => FirebaseStorage.bucket().file(gsPath).delete())
    );
    const failedDeletions = deletionResults.filter((r) => r.status === "rejected");
    if (failedDeletions.length > 0) {
      const failedPaths = failedDeletions.map((r) => r.reason as unknown);
      throw CustomApiError.create(500, "Internal Server Error", failedPaths);
    }
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
