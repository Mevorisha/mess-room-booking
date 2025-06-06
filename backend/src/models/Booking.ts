import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { FirebaseFirestore, FirestorePaths } from "@/firebase/init";
import { CustomApiError } from "@/types/CustomApiError";
import { AutoSetFields } from "./types";

export type AcceptanceStatus = "ACCEPTED" | "REJECTED";

export interface BookingData {
  tenantId: string;
  roomId: string;
  occupantCount: number;
  acceptance?: AcceptanceStatus;
  acceptedOn?: FirebaseFirestore.Timestamp;
  cancelledOn?: FirebaseFirestore.Timestamp;
  clearedOn?: FirebaseFirestore.Timestamp;
  // AutoSetFields
  createdOn: FirebaseFirestore.Timestamp;
  lastModifiedOn: FirebaseFirestore.Timestamp;
  ttl?: FirebaseFirestore.Timestamp;
}

// During create, only tenantId, roomId and occupantCount may be set
type BookingCreateData = Pick<BookingData, "tenantId" | "roomId" | "occupantCount">;
// During update, apart from AutoSetFields, tenantId, roomId & occupantCount MUST not be set
type BookingUpdateData = Partial<Omit<BookingData, AutoSetFields | "tenantId" | "roomId" | "occupantCount">>;
// During read, all data may be read
type BookingReadData = Partial<BookingData & { isAccepted: boolean; isCancelled: boolean; isCleared: boolean }>;
// Params to query a booking by
export type BookingQueryParams = Partial<{
  tenantId: string;
  roomId: string;
  acceptance: AcceptanceStatus;
  isAccepted: boolean;
  isCancelled: boolean;
  isCleared: boolean;
  createdOn: FirebaseFirestore.Timestamp;
  lastModifiedOn: FirebaseFirestore.Timestamp;
}>;

export enum SchemaFields {
  TENANT_ID = "tenantId",
  ROOM_ID = "roomId",
  OCCUPANT_COUNT = "occupantCount",
  ACCEPTANCE = "acceptance",
  ACCEPTED_ON = "acceptedOn",
  CANCELLED_ON = "cancelledOn",
  CLEARED_ON = "clearedOn",
  CREATED_ON = "createdOn",
  LAST_MODIFIED_ON = "lastModifiedOn",
  TTL = "ttl",
}

export enum OneTimeSetFields {
  ACCEPTANCE = "acceptance",
  ACCEPTED_ON = "acceptedOn",
  CANCELLED_ON = "cancelledOn",
  CLEARED_ON = "clearedOn",
}

export enum PsudoFields {
  IS_ACCEPTED = "isAccepted",
  IS_CLEARED = "isCleared",
  IS_CANCELLED = "isCancelled",
}

type BookingReadDataWithId = BookingReadData & { id: string };

class Booking {
  /**
   * Create a new booking document
   */
  static async create(bookingData: BookingCreateData): Promise<string> {
    const ref = FirebaseFirestore.collection(FirestorePaths.BOOKINGS);
    const docRef = await ref.add({
      ...bookingData,
      // Add auto fields
      createdOn: FieldValue.serverTimestamp(),
      lastModifiedOn: FieldValue.serverTimestamp(),
    });
    return docRef.id;
  }

  /**
   * Update an existing booking document
   */
  static async update(bookingId: string, updateData: BookingUpdateData): Promise<void> {
    const docRef = FirestorePaths.Bookings(bookingId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw CustomApiError.create(404, "Booking not found");
    }

    const data = docSnapshot.data();
    if (data) {
      for (const field of Object.values(OneTimeSetFields)) {
        if (data[field] && updateData[field]) {
          throw CustomApiError.create(400, `Cannot update one-time-set field: '${field}'`);
        }
      }
    }

    try {
      await docRef.update({
        ...updateData,
        lastModifiedOn: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      throw CustomApiError.create(404, "Booking not found");
    }
  }

  /**
   * Get specific fields from a booking document
   */
  static async get(
    id: string,
    fields: (SchemaFields | PsudoFields | OneTimeSetFields)[] = []
  ): Promise<BookingReadData | null> {
    const ref = FirestorePaths.Bookings(id);

    const doc = await ref.get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) {
      return null;
    }

    // Add pseudo fields
    data["isAccepted"] = !!data["acceptedOn"];
    data["isCancelled"] = !!data["cancelledOn"];
    data["isCleared"] = !!data["clearedOn"];

    // If no fields given return all params
    if (fields.length === 0) {
      return data;
    }

    // Filter params
    const result = {} as BookingReadData;
    for (const field of fields) {
      (result as any)[field] = data[field] || null;
    }

    return result;
  }

  /**
   * Query all bookings with filtering options
   */
  static async queryAll(params: BookingQueryParams): Promise<BookingReadDataWithId[]> {
    const ref = FirebaseFirestore.collection(FirestorePaths.BOOKINGS);
    let query: any = ref;

    // Apply filters for exact matches
    if (params.tenantId) {
      query = query.where(SchemaFields.TENANT_ID, "==", params.tenantId);
    }
    if (params.roomId) {
      query = query.where(SchemaFields.ROOM_ID, "==", params.roomId);
    }
    if (params.acceptance) {
      query = query.where(SchemaFields.ACCEPTANCE, "==", params.acceptance);
    }

    // Timestamp filters
    if (params.createdOn) {
      query = query.where(SchemaFields.CREATED_ON, ">=", params.createdOn);
    }
    if (params.lastModifiedOn) {
      query = query.where(SchemaFields.LAST_MODIFIED_ON, ">=", params.lastModifiedOn);
    }

    // Always sort by lastModifiedOn
    query = query.orderBy(SchemaFields.LAST_MODIFIED_ON, "desc");

    // Execute query
    const snapshot = await query.get();
    const results: BookingReadDataWithId[] = [];

    // Process results and apply status filters in code if needed
    for (const doc of snapshot.docs) {
      const data = doc.data() as BookingReadData;

      // Add pseudo fields
      data.isAccepted = !!data.acceptedOn;
      data.isCancelled = !!data.cancelledOn;
      data.isCleared = !!data.clearedOn;

      // Filter by pseudo fields if specified
      if (
        (params.isAccepted !== undefined && data.isAccepted !== params.isAccepted) ||
        (params.isCancelled !== undefined && data.isCancelled !== params.isCancelled) ||
        (params.isCleared !== undefined && data.isCleared !== params.isCleared)
      ) {
        continue; // Skip this document if it doesn't match the status filters
      }

      results.push({ ...data, id: doc.id });
    }

    return results;
  }

  /**
   * Mark a booking for deletion after a set period
   */
  static async markForDelete(bookingId: string): Promise<number> {
    const data = await Booking.get(bookingId, [PsudoFields.IS_CANCELLED, PsudoFields.IS_CLEARED]);
    if (!data?.isCleared && !data?.isCancelled) {
      throw CustomApiError.create(409, "Cannot delete active booking. Needs to be cleared or cancelled first");
    }
    const daysToLive = 30;
    const ref = FirestorePaths.Bookings(bookingId);
    const ttl = Timestamp.fromDate(new Date(Date.now() + daysToLive * 24 * 60 * 60 * 1000));
    try {
      await ref.update({
        ttl,
        lastModifiedOn: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      throw CustomApiError.create(404, "Booking not found");
    }

    return daysToLive;
  }

  /**
   * Remove the deletion marker from a booking
   */
  static async unmarkForDelete(bookingId: string): Promise<void> {
    const ref = FirestorePaths.Bookings(bookingId);
    try {
      await ref.update({
        ttl: FieldValue.delete(),
        lastModifiedOn: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      throw CustomApiError.create(404, "Booking not found");
    }
  }

  /**
   * Immediately delete a booking
   */
  static async forceDelete(bookingId: string): Promise<void> {
    const data = await Booking.get(bookingId, [PsudoFields.IS_CANCELLED, PsudoFields.IS_CLEARED]);
    if (!data?.isCleared && !data?.isCancelled) {
      throw CustomApiError.create(409, "Cannot delete active booking. Needs to be cleared or cancelled first");
    }
    const ref = FirestorePaths.Bookings(bookingId);
    try {
      await ref.delete();
    } catch (e) {
      throw CustomApiError.create(404, "Booking not found");
    }
  }
}

export default Booking;
