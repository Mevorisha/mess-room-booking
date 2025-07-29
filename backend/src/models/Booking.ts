import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { FirebaseFirestore, FirestorePaths } from "@/firebase/init";
import { CustomApiError } from "@/types/CustomApiError";
import Room from "./Room";

export type AcceptanceStatus = "ACCEPTED" | "REJECTED" | "UNSET";

export interface BookingData {
  tenantId: string;
  roomId: string;
  occupantCount: number;
  linkToWorkId?: string;
  linkToGovId?: string;
  // these properties can be set ony once
  isSubmitted: boolean;
  acceptanceStatus: AcceptanceStatus;
  isCancelled: boolean;
  isCleared: boolean;
  // timestamps to be set when above 3 propertis are set
  submittedOn?: FirebaseFirestore.Timestamp;
  acceptedOn?: FirebaseFirestore.Timestamp;
  cancelledOn?: FirebaseFirestore.Timestamp;
  clearedOn?: FirebaseFirestore.Timestamp;
  // AutoSetFields
  createdOn: FirebaseFirestore.Timestamp;
  lastModifiedOn: FirebaseFirestore.Timestamp;
  ttl?: FirebaseFirestore.Timestamp;
}

// During create, only tenantId, roomId and occupantCount may be set
type BookingCreateData = Pick<BookingData, "tenantId" | "roomId" | "occupantCount" | "linkToWorkId" | "linkToGovId">;

// During update, apart from AutoSetFields, tenantId, roomId & occupantCount MUST not be set
type BookingUpdateData = Pick<BookingData, "occupantCount" | "linkToWorkId" | "linkToGovId">;

// During read, all data may be read
type BookingReadData = Partial<BookingData>;

export type BookingQueryParams = Partial<{
  queryIdType?: "ROOM" | "TENANT" | "OWNER";
  id?: string;
}>;

export enum SchemaFields {
  TENANT_ID = "tenantId",
  ROOM_ID = "roomId",
  OCCUPANT_COUNT = "occupantCount",
  LINK_TO_WORK_ID = "linkToWorkId",
  LINK_TO_GOV_ID = "linkToGovId",
  IS_SUBMITTED = "isSubmitted",
  ACCEPTANCE_STATUS = "acceptanceStatus",
  IS_CANCELLED = "isCancelled",
  IS_CLEARED = "isCleared",
  ACCEPTED_ON = "acceptedOn",
  CANCELLED_ON = "cancelledOn",
  CLEARED_ON = "clearedOn",
  CREATED_ON = "createdOn",
  LAST_MODIFIED_ON = "lastModifiedOn",
  TTL = "ttl",
}

export enum OneTimeSetFields {
  IS_SUBMITTED = "isSubmitted",
  ACCEPTANCE_STATUS = "acceptanceStatus",
  IS_CANCELLED = "isCancelled",
  IS_CLEARED = "isCleared",
  SUBMITTED_ON = "submittedOn",
  ACCEPTED_ON = "acceptedOn",
  CANCELLED_ON = "cancelledOn",
  CLEARED_ON = "clearedOn",
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
      // Set default values for one-time fields
      isSubmitted: false,
      acceptanceStatus: "UNSET",
      isCancelled: false,
      isCleared: false,
      // Other timestamps will be left unset
      // Add auto-set fields
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

    try {
      await docRef.update({
        ...updateData,
        lastModifiedOn: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      throw CustomApiError.create(404, "Booking not found");
    }
  }

  static async markStatus(
    bookingId: string,
    status:
      | {
          type: SchemaFields.IS_SUBMITTED | SchemaFields.IS_CANCELLED | SchemaFields.IS_CLEARED;
          value: true | 1 | "true" | "yes";
        }
      | {
          type: SchemaFields.ACCEPTANCE_STATUS;
          value: Omit<AcceptanceStatus, "UNSET">;
        }
  ): Promise<void> {
    const docRef = FirestorePaths.Bookings(bookingId);
    const docSnapshot = await docRef.get();

    if (!docSnapshot.exists) {
      throw CustomApiError.create(404, "Booking not found");
    }

    const data = docSnapshot.data() as BookingReadData | undefined;
    if (!data) {
      throw CustomApiError.create(404, "Booking not found");
    }

    try {
      switch (status.type) {
        case SchemaFields.IS_SUBMITTED: {
          // submit i.e. the tenant has confirmed their booking and is ready to occupy the room - this will await acceptance or rejection by owner
          // in other words, tenant can exercise this when the booking is created for the first time
          // cancelled bookings cannot be submitted
          if (data["isCancelled"]) {
            throw CustomApiError.create(409, "Cancelled booking cannot be submitted");
          }
          // cleared bookings cannot be submitted
          if (data["isCleared"]) {
            throw CustomApiError.create(409, "Cleared booking cannot be submitted");
          }
          // accepted or rejected bookings cannot be submitted as they have already been submitted
          // they must have been submitted before as that's how acceptance status is checked before setting
          if (data["acceptanceStatus"] !== "UNSET") {
            throw CustomApiError.create(409, "Accepted or rejected booking cannot be submitted");
          }
          // submitted bookings cannot be submitted again
          if (data["isSubmitted"]) {
            throw CustomApiError.create(409, "Booking already submitted");
          }
          // update the booking
          await docRef.update({
            isSubmitted: true,
            submittedOn: FieldValue.serverTimestamp(),
            lastModifiedOn: FieldValue.serverTimestamp(),
          });
          break;
        }
        case SchemaFields.IS_CANCELLED: {
          // cancel i.e. the tenant does not wish to occupy the room anymore - this will free up the room for new tenants
          // in other words, tenant can exercise this only if they have submitted but their booking is not accepted yet
          // unsubmitted bookings does not need to be cancelled
          if (!data["isSubmitted"]) {
            throw CustomApiError.create(409, "Unsubmitted booking does not need to be cancelled");
          }
          // cleared bookings does not need to be cancelled
          if (data["isCleared"]) {
            throw CustomApiError.create(409, "Cleared booking does not need to be cancelled");
          }
          // accepted bookings needs to be cleared, not cancelled
          if (data["acceptanceStatus"] === "ACCEPTED") {
            throw CustomApiError.create(409, "Accepted booking cannot be cancelled. Please clear it instead");
          }
          // rejected bookings do not need to be cancelled as they are automatically cancelled
          if (data["acceptanceStatus"] === "REJECTED") {
            throw CustomApiError.create(409, "Rejected booking does not need to be cancelled");
          }
          // cancelled bookings cannot be cancelled again
          if (data["isCancelled"]) {
            throw CustomApiError.create(409, "Booking already cancelled");
          }
          // update the booking
          await docRef.update({
            isCancelled: true,
            cancelledOn: FieldValue.serverTimestamp(),
            lastModifiedOn: FieldValue.serverTimestamp(),
          });
          break;
        }
        case SchemaFields.IS_CLEARED: {
          // clear i.e. the tenant is leaving - this will free up the room for new tenants
          // in other words, tenant can exercise this only after the booking is accepted
          // unsubmitted bookings does not need to be cleared
          if (!data["isSubmitted"]) {
            throw CustomApiError.create(409, "Unsubmitted booking does not need to be cleared");
          }
          // cancelled bookings does not need to be cleared
          if (data["isCancelled"]) {
            throw CustomApiError.create(409, "Cancelled booking does not need to be cleared");
          }
          // unset or rejected bookings cannot be cleared
          if (data["acceptanceStatus"] === "UNSET") {
            throw CustomApiError.create(409, "Cannot clear booking that is neither accepted nor rejected");
          }
          if (data["acceptanceStatus"] === "REJECTED") {
            throw CustomApiError.create(409, "Rejected booking cannot be cleared");
          }
          // cleared bookings cannot be cleared again
          if (data["isCleared"]) {
            throw CustomApiError.create(409, "Booking already cleared");
          }
          // update the booking
          await docRef.update({
            isCleared: true,
            clearedOn: FieldValue.serverTimestamp(),
            lastModifiedOn: FieldValue.serverTimestamp(),
          });
          break;
        }
        case SchemaFields.ACCEPTANCE_STATUS: {
          // accept or reject a booking - this is done only by the owner, accepting means room is occupied by occupantCount
          // in other words, owner can exercise this only if the booking is submitted
          // unsubmitted bookings does not need to be accepted or rejected
          if (!data["isSubmitted"]) {
            throw CustomApiError.create(409, "Unsubmitted booking does not need to be accepted or rejected");
          }
          // cancelled bookings does not need to be accepted or rejected
          if (data["isCancelled"]) {
            throw CustomApiError.create(409, "Cancelled booking does not need to be accepted or rejected");
          }
          // cleared bookings does not need to be accepted or rejected
          if (data["isCleared"]) {
            throw CustomApiError.create(409, "Cleared booking does not need to be accepted or rejected");
          }
          // accepted bookings cannot be accepted again
          if (data["acceptanceStatus"] === "ACCEPTED") {
            throw CustomApiError.create(409, "Booking already accepted");
          }
          // rejected bookings cannot be accepted again
          if (data["acceptanceStatus"] === "REJECTED") {
            throw CustomApiError.create(409, "Booking already rejected");
          }
          // if accepted, set acceptedOn timestamp
          if (status.value === "ACCEPTED") {
            await docRef.update({
              acceptanceStatus: "ACCEPTED",
              acceptedOn: FieldValue.serverTimestamp(),
              lastModifiedOn: FieldValue.serverTimestamp(),
            });
          }
          // if rejected, set rejectedOn timestamp and also cancel the booking
          if (status.value === "REJECTED") {
            await docRef.update({
              acceptanceStatus: "REJECTED",
              cancelledOn: FieldValue.serverTimestamp(),
              isCancelled: true,
              lastModifiedOn: FieldValue.serverTimestamp(),
            });
          }
          break;
        }
        default:
          throw CustomApiError.create(400, "Invalid status type");
      }
    } catch (e) {
      throw CustomApiError.create(404, "Booking not found");
    }
  }

  /**
   * Get specific fields from a booking document
   */
  static async get(id: string, fields: (SchemaFields | OneTimeSetFields)[] = []): Promise<BookingReadData | null> {
    const ref = FirestorePaths.Bookings(id);

    const doc = await ref.get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) {
      return null;
    }

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

    const queryIdType = params.queryIdType ?? "NONE";

    if (queryIdType === "ROOM" && params.id) {
      const query = ref.where(SchemaFields.ROOM_ID, "==", params.id).orderBy(SchemaFields.LAST_MODIFIED_ON, "desc");
      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({
        ...(doc.data() as BookingReadData),
        id: doc.id,
      }));
    }

    // Apply filter using tenant id if present
    if (queryIdType === "TENANT" && params.id) {
      const query = ref
        .where(SchemaFields.TENANT_ID, "==", params.id)
        .orderBy(SchemaFields.LAST_MODIFIED_ON, "desc");

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({
        ...(doc.data() as BookingReadData),
        id: doc.id,
      }));
    }

    // Apply filters using room ids of the owner if present
    else if (queryIdType === "OWNER" && params.id) {
      const roomsByOwner = await Room.queryAll({ ownerId: params.id }, "API_URI");
      const roomIds = roomsByOwner.map((room) => room.id);

      if (roomIds.length === 0) {
        return [];
      }

      // Firestore 'in' operator supports max 10 values, so batch queries
      const BATCH_SIZE = 10;
      const bookings: BookingReadDataWithId[] = [];

      for (let i = 0; i < roomIds.length; i += BATCH_SIZE) {
        const batch = roomIds.slice(i, i + BATCH_SIZE);
        const query = ref.where(SchemaFields.ROOM_ID, "in", batch).orderBy(SchemaFields.LAST_MODIFIED_ON, "desc");
        const snapshot = await query.get();
        const batchResults = snapshot.docs.map((doc) => ({
          ...(doc.data() as BookingReadData),
          id: doc.id,
        }));
        bookings.push(...batchResults);
      }

      // Sort all results by lastModifiedOn in descending order
      bookings.sort((a, b) => {
        // Handle undefined dates
        if (!a.lastModifiedOn || !b.lastModifiedOn) {
          return 0;
        }
        return b.lastModifiedOn.toMillis() - a.lastModifiedOn.toMillis();
      });

      return bookings;
    }

    // If no filters are applied, return all bookings
    else {
      const snapshot = await ref.orderBy(SchemaFields.LAST_MODIFIED_ON, "desc").get();
      return snapshot.docs.map((doc) => ({
        ...(doc.data() as BookingReadData),
        id: doc.id,
      }));
    }
  }

  /**
   * Mark a booking for deletion after a set period
   */
  static async markForDelete(bookingId: string): Promise<number> {
    const data = await Booking.get(bookingId, [SchemaFields.IS_CANCELLED, SchemaFields.IS_CLEARED]);
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
    const data = await Booking.get(bookingId, [SchemaFields.IS_CANCELLED, SchemaFields.IS_CLEARED]);
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
