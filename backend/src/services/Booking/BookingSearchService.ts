import { FirebaseFirestore, FirestorePaths } from "@/firebase/init";
import { CustomApiError } from "@/types/CustomApiError";
import { ApiResponseUrlType, BookingGetResBodyDTO, MultipleErrors, QuerySortOrder, RoomGetReqQueryParamsWrapper } from "sharedtypes";
import { RoomSearchService } from "@/services/Room/RoomSearchService";
import { QueryWrapper } from "@/types/QueryWrapper";
import { BookingModel } from "@/models/Booking";

export class BookingSearchService {
  /**
   * Query all bookings with filtering options
   */
  static async queryAll(params: { type: "ROOM"; roomId: string }): Promise<BookingGetResBodyDTO[]>;
  static async queryAll(params: { type: "TENANT"; tenantId: string }): Promise<BookingGetResBodyDTO[]>;
  static async queryAll(params: { type: "OWNER"; ownerId: string }): Promise<BookingGetResBodyDTO[]>;

  // Implementation
  static async queryAll(
    // prettier-ignore
    params:
      | { type: "ROOM"; roomId: string }
      | { type: "TENANT"; tenantId: string }
      | { type: "OWNER"; ownerId: string }
  ): Promise<BookingGetResBodyDTO[]> {
    const ref = FirebaseFirestore.collection(FirestorePaths.BOOKINGS);
    let bookingModels: BookingModel[] = [];

    // owner views rooms using id of the room
    switch (params.type) {
      case "ROOM": {
        const snapshots = await QueryWrapper.create<BookingModel>(ref)
          .where("roomId", "==", params.roomId)
          .orderBy("lastModifiedOn", QuerySortOrder.DESCENDING)
          .getQuery()
          .get();

        if (snapshots.empty) {
          return [];
        }
        bookingModels = snapshots.docs.map((doc) => doc.data());
        break;
      }
      // Apply filter using tenant id if present
      case "TENANT": {
        const snapshots = await QueryWrapper.create<BookingModel>(ref)
          .where("tenantId", "==", params.tenantId)
          .orderBy("lastModifiedOn", QuerySortOrder.DESCENDING)
          .getQuery()
          .get();

        if (snapshots.empty) {
          return [];
        }
        bookingModels = snapshots.docs.map((doc) => doc.data());
        break;
      }
      // Apply filters using room ids of the owner if present
      case "OWNER": {
        const queryWrapperResult = RoomGetReqQueryParamsWrapper.create({ ownerId: params.ownerId });
        if (queryWrapperResult.isErr) {
          throw CustomApiError.create(500, "Internal Server Error", queryWrapperResult.error);
        }
        const roomsByOwner = await RoomSearchService.queryAll(queryWrapperResult.value, ApiResponseUrlType.API_URI);
        const roomIds = roomsByOwner.map((room) => room.id);

        if (roomIds.length === 0) {
          return [];
        }

        // Firestore 'in' operator supports max 10 values, so batch queries
        const BATCH_SIZE = 10;

        for (let i = 0; i < roomIds.length; i += BATCH_SIZE) {
          const batch = roomIds.slice(i, i + BATCH_SIZE);
          const snapshots = await QueryWrapper.create<BookingModel>(ref)
            .where("roomId", "in", batch)
            .orderBy("lastModifiedOn", QuerySortOrder.DESCENDING)
            .getQuery()
            .get();
          if (snapshots.empty) continue;
          const batchResults = snapshots.docs.map((doc) => doc.data());
          bookingModels.push(...batchResults);
        }

        // Sort all results by lastModifiedOn in descending order
        bookingModels.sort((a, b) => b.lastModifiedOn.toMillis() - a.lastModifiedOn.toMillis());

        break;
      }
    }

    // Common processing for all query types
    // Filter out bookings that are not submitted (yet)
    // coz the owner does not need to see unsubmitted bookings
    const filteredBookingModels = bookingModels.filter((booking) => booking.isSubmitted);

    const bookingResults = filteredBookingModels.map((booking) => BookingGetResBodyDTO.fromJson(booking));
    const errors = bookingResults.filter((result) => result.isErr).map((result) => result.error);
    const bookingDTOs = bookingResults.filter((result) => result.isOk).map((result) => result.value);
    if (errors.length > 0) {
      if (bookingDTOs.length === 0) {
        // If no room can be returned coz all are errors
        throw CustomApiError.create(500, "Internal Server Error", errors);
      } else {
        console.error("[E] [BookingSearchService] some 'BookingGetResBodyDTO' conversions failed");
        console.error(new MultipleErrors(errors));
        // Return whatever was found
        return bookingDTOs;
      }
    }
    return bookingDTOs;
  }
}
