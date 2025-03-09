import { Timestamp } from "firebase-admin/firestore";
import { FirebaseFirestore, FirestorePaths } from "@/lib/firebaseAdmin/init";
import { CustomApiError } from "@/lib/utils/ApiError";
import { AutoSetFields } from "./utils";

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

class Booking {
  /**
   * Create a new booking document
   */
  static async create(bookingData: BookingCreateData): Promise<string> {
    const ref = FirebaseFirestore.collection(FirestorePaths.BOOKINGS);
    const createdOn = Timestamp.now();
    const docRef = await ref.add({ ...bookingData, createdOn });
    return docRef.id;
  }

  /**
   * Update an existing booking document
   */
  static async update(bookingId: string, updateData: BookingUpdateData): Promise<void> {
    const docRef = FirestorePaths.Bookings(bookingId);
    const lastModifiedOn = Timestamp.now();
    const docSnapshot = await docRef.get();
    if (docSnapshot.exists) {
      const data = docSnapshot.data();
      if (data) {
        for (const field of Object.values(OneTimeSetFields)) {
          if (data[field] && updateData[field]) {
            return Promise.reject(CustomApiError.create(400, `Cannot update one-time-set field: '${field}'`));
          }
        }
      }
    }
    await docRef.set({ ...updateData, lastModifiedOn }, { merge: true });
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
    data.isAccepted = !!data.acceptedOn;
    data.isCancelled = !!data.cancelledOn;
    data.isCleared = !!data.clearedOn;

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
}

export default Booking;
