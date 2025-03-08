import firestore from "firebase-admin/firestore";
import { FirebaseFirestore, FirestorePaths } from "@/lib/firebaseAdmin/init";
import { CustomApiError } from "@/lib/utils/ApiError";

export type AcceptanceStatus = "ACCEPTED" | "REJECTED";

export interface BookingData {
  tenantId: string;
  roomId: string;
  occupantCount: number;
  requestedOn: FirebaseFirestore.Timestamp;
  acceptance?: AcceptanceStatus;
  acceptedOn?: FirebaseFirestore.Timestamp;
  cancelledOn?: FirebaseFirestore.Timestamp;
  clearedOn?: FirebaseFirestore.Timestamp;
  ttl?: FirebaseFirestore.Timestamp;
}

export enum SchemaFields {
  TENANT_ID = "tenantId",
  ROOM_ID = "roomId",
  OCCUPANT_COUNT = "occupantCount",
  REQUESTED_ON = "requestedOn",
  ACCEPTANCE = "acceptance",
  ACCEPTED_ON = "acceptedOn",
  CANCELLED_ON = "cancelledOn",
  CLEARED_ON = "clearedOn",
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
  static async create(tenantId: string, roomId: string, occupantCount: number): Promise<string> {
    const ref = FirebaseFirestore.collection(FirestorePaths.BOOKINGS);
    const requestedOn = firestore.Timestamp.now();
    try {
      const docRef = await ref.add({ tenantId, roomId, occupantCount, requestedOn });
      return docRef.id;
    } catch (e) {
      return Promise.reject(CustomApiError.create(500, e.message));
    }
  }

  /**
   * Update an existing booking document
   */
  static async update(id: string, updateData: Partial<BookingData>): Promise<void> {
    const docRef = FirestorePaths.Bookings(id);
    try {
      const docSnapshot = await docRef.get();
      if (docSnapshot.exists) {
        const data = docSnapshot.data();
        if (data) {
          for (const field of Object.values(OneTimeSetFields)) {
            if (data[field] && updateData[field]) {
              return Promise.reject(CustomApiError.create(400, `Cannot update one-time-set field: ${field}`));
            }
          }
        }
      }
      await docRef.set(updateData, { merge: true });
    } catch (e) {
      return Promise.reject(CustomApiError.create(500, e.message));
    }
  }

  /**
   * Get specific fields from a booking document
   */
  static async get(
    id: string,
    fields: (SchemaFields | PsudoFields | OneTimeSetFields)[] = []
  ): Promise<Partial<BookingData & { isAccepted: boolean; isCancelled: boolean; isCleared: boolean }> | null> {
    const ref = FirestorePaths.Bookings(id);
    try {
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
      const result = {} as Partial<BookingData & { isAccepted: boolean; isCancelled: boolean; isCleared: boolean }>;
      for (const field of fields) {
        (result as any)[field] = data[field] || null;
      }
      return result;
    } catch (e) {
      return Promise.reject(CustomApiError.create(500, e.message));
    }
  }
}

export default Booking;
