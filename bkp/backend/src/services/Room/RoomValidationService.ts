import { FirebaseFirestore, FirestorePaths } from "@/firebase/init";
import Booking from "@/models/Booking";
import { SchemaFields } from "@/models/Room";
import { RoomCreateData } from "@/models/Room";
import { CustomApiError } from "@/types/CustomApiError";

export default class RoomValidationService {
  static async validateUniqueRoom(roomData: RoomCreateData): Promise<void> {
    const querySnapshot = await FirebaseFirestore.collection(FirestorePaths.ROOMS)
      .where(SchemaFields.OWNER_ID, "==", roomData.ownerId)
      .where(SchemaFields.ADDRESS, "==", roomData.address)
      .where(SchemaFields.CITY, "==", roomData.city)
      .where(SchemaFields.STATE, "==", roomData.state)
      .where(SchemaFields.CAPACITY, "==", roomData.capacity)
      .where(SchemaFields.PRICE_PER_OCCUPANT, "==", roomData.pricePerOccupant)
      .get();

    if (!querySnapshot.empty) {
      throw CustomApiError.create(409, "Room w/ same address, price and capacity already exists");
    }
  }

  static async validateRoomNotInUse(roomId: string): Promise<void> {
    const bookings = await Booking.queryAll({ queryIdType: "ROOM", id: roomId });
    const activeBookings = bookings.filter((b) => !(b.isCancelled ?? false) && !(b.isCleared ?? false));

    if (activeBookings.length > 0) {
      throw CustomApiError.create(409, "Room is in use");
    }
  }
}
