import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { FirebaseFirestore, FirestorePaths } from "@/firebase/init";
import { CustomApiError } from "@/types/CustomApiError";
import pickObjProps from "@/utils/pickObjProps";
import { BookingGetResBodyDTO, BookingPostReqBodyDTO, BookingStatus } from "sharedtypes";
import { DateTransformer } from "@/dataTransformers/DateTransformer";
import { BookingModel } from "@/models/Booking";

export class BookingRepo {
  /**
   * Create a new booking document
   */
  static async create(dto: BookingPostReqBodyDTO): Promise<string> {
    // for safety, ensure only the acceptable fields are present
    const bookingData = pickObjProps(dto, ["tenantId", "roomId", "occupantCount", "linkToWorkId", "linkToGovId"]);

    const docRef = FirebaseFirestore.collection(FirestorePaths.BOOKINGS).doc();
    const createData: BookingModel = {
      ...bookingData,
      // Set default values for one-time fields
      id: docRef.id,
      isSubmitted: false,
      acceptanceStatus: BookingStatus.UNSET,
      isCancelled: false,
      isCleared: false,
      // Add auto fields (cast as Timestamp for typesafety)
      createdOn: FieldValue.serverTimestamp() as unknown as Timestamp,
      lastModifiedOn: FieldValue.serverTimestamp() as unknown as Timestamp,
    };

    await docRef.set(createData);
    return docRef.id;
  }

  /**
   * Update an existing booking document
   */
  static async update(
    bookingId: string,
    updateData: Pick<BookingModel, "occupantCount" | "linkToWorkId" | "linkToGovId">
  ): Promise<void> {
    // for safety, ensure only the acceptable fields are present
    updateData = pickObjProps(updateData, ["occupantCount", "linkToWorkId", "linkToGovId"]);

    const docRef = FirestorePaths.Bookings(bookingId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw CustomApiError.create(404, "Booking not found");
    }

    try {
      await docRef.update({ ...updateData, lastModifiedOn: FieldValue.serverTimestamp() });
    } catch (e) {
      throw CustomApiError.create(404, "Booking not found", e);
    }
  }

  /**
   * Get specific fields from a booking document
   */
  static async findById(bookingId: string): Promise<BookingGetResBodyDTO | null> {
    const ref = FirestorePaths.Bookings(bookingId);

    const doc = await ref.get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as BookingModel | null;
    if (data == null) {
      return null;
    }

    // convert timestamps to strings
    const dateTransformed = DateTransformer.transform(data);

    const jsonResult = BookingGetResBodyDTO.fromJson(dateTransformed);
    if (jsonResult.isErr) {
      throw CustomApiError.create(500, "Internal Server Error", jsonResult.error);
    }
    return jsonResult.value;
  }
}
