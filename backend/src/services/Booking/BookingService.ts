import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { FirestorePaths } from "@/firebase/init";
import { CustomApiError } from "@/types/CustomApiError";
import { BookingStatus } from "sharedtypes";
import { BookingRepo } from "@/repo/BookingRepo";

export class BookingService {
  static async markStatus(bookingId: string, status: { type: "isSubmitted" }): Promise<void>;
  static async markStatus(bookingId: string, status: { type: "isCancelled" }): Promise<void>;
  static async markStatus(bookingId: string, status: { type: "isCleared" }): Promise<void>;
  static async markStatus(
    bookingId: string,
    status: { type: "acceptanceStatus"; value: Omit<BookingStatus, "UNSET"> }
  ): Promise<void>;

  /**
   * BOOKING STATUS STATE TRANSITION TABLE
   *
   * Current State → Allowed Actions → Next State
   *
   * ┌─────────────────┬──────────────┬─────────────┬─────────────┬──────────────────────────┐
   * │ Current State   │ Submit       │ Cancel      │ Clear       │ Accept/Reject            │
   * ├─────────────────┼──────────────┼─────────────┼─────────────┼──────────────────────────┤
   * │ UNSUBMITTED     │ ✓ SUBMITTED  │ ✗ Error     │ ✗ Error     │ ✗ Error                  │
   * │ SUBMITTED       │ ✗ Error      │ ✓ CANCELLED │ ✗ Error     │ ✓ ACCEPTED/REJECTED      │
   * │ CANCELLED       │ ✗ Error      │ ✗ Error     │ ✗ Error     │ ✗ Error                  │
   * │ ACCEPTED        │ ✗ Error      │ ✗ Error*    │ ✓ CLEARED   │ ✗ Error                  │
   * │ REJECTED        │ ✗ Error      │ ✗ Error     │ ✗ Error     │ ✗ Error                  │
   * │ CLEARED         │ ✗ Error      │ ✗ Error     │ ✗ Error     │ ✗ Error                  │
   * └─────────────────┴──────────────┴─────────────┴─────────────┴──────────────────────────┘
   *
   * *Note: ACCEPTED bookings cannot be cancelled - they must be cleared instead
   *
   * TERMINAL STATES: CANCELLED, REJECTED, CLEARED
   * - Once a booking reaches any terminal state, no further status changes are allowed
   *
   * STATE DESCRIPTIONS:
   * - UNSUBMITTED: Booking created but not yet submitted by tenant
   * - SUBMITTED: Booking submitted by tenant, awaiting owner decision
   * - CANCELLED: Booking cancelled by tenant (before acceptance or after rejection)
   * - ACCEPTED: Booking accepted by owner, tenant can occupy room
   * - REJECTED: Booking rejected by owner, booking terminated
   * - CLEARED: Tenant has left the room after occupying it
   *
   * BUSINESS RULES:
   * 1. Only fresh bookings can be submitted
   * 2. Only submitted bookings can be cancelled or accepted/rejected
   * 3. Only accepted bookings can be cleared
   * 4. Terminal states cannot transition to any other state
   * 5. Accepted bookings must be cleared, not cancelled
   */
  static async markStatus(
    bookingId: string,
    status:
      | { type: "isSubmitted" }
      | { type: "isCancelled" }
      | { type: "isCleared" }
      | { type: "acceptanceStatus"; value: Omit<BookingStatus, "UNSET"> }
  ): Promise<void> {
    const data = await BookingRepo.findById(bookingId);
    if (data == null) {
      throw CustomApiError.create(404, "Booking not found");
    }

    try {
      switch (status.type) {
        case "isSubmitted": {
          // submit i.e. the tenant has confirmed their booking and is ready to occupy the room - this will await acceptance or rejection by owner
          // in other words, tenant can exercise this when the booking is created for the first time
          // cancelled bookings cannot be submitted (they've already completed their lifecycle)
          if (data.isCancelled) {
            throw CustomApiError.create(409, "Cancelled booking cannot be submitted");
          }
          // cleared bookings cannot be submitted (they've already completed their lifecycle)
          if (data.isCleared) {
            throw CustomApiError.create(409, "Cleared booking cannot be submitted");
          }
          // accepted or rejected bookings cannot be submitted (they have already been submitted)
          if (data.acceptanceStatus !== BookingStatus.UNSET) {
            throw CustomApiError.create(409, "Accepted or rejected booking cannot be submitted");
          }
          // submitted bookings cannot be submitted again
          if (data.isSubmitted) {
            throw CustomApiError.create(409, "Booking already submitted");
          }
          // update the booking
          await FirestorePaths.Bookings(bookingId).update({
            isSubmitted: true,
            submittedOn: FieldValue.serverTimestamp(),
            lastModifiedOn: FieldValue.serverTimestamp(),
          });
          break;
        }
        case "isCancelled": {
          // cancel i.e. the tenant does not wish to occupy the room anymore - this will free up the room for new tenants
          // can be used to cancel unsubmitted bookings (cleanup), submitted but pending bookings, or rejected bookings
          // unsubmitted bookings cannot be cancelled (they'll be hidden from room owners)
          if (!data.isSubmitted) {
            throw CustomApiError.create(409, "Unsubmitted booking cannot be cancelled");
          }
          // cleared bookings cannot be cancelled (they've already completed their lifecycle)
          if (data.isCleared) {
            throw CustomApiError.create(409, "Cleared booking cannot be cancelled");
          }
          // accepted bookings need to be cleared, not cancelled (tenant is leaving after occupation)
          if (data.acceptanceStatus === BookingStatus.ACCEPTED) {
            throw CustomApiError.create(409, "Accepted booking cannot be cancelled. Please clear it instead");
          }
          // rejected bookings do not need to be cancelled (they've already completed their lifecycle)
          if (data.acceptanceStatus === BookingStatus.REJECTED) {
            throw CustomApiError.create(409, "Rejected booking cannot be cancelled");
          }
          // cancelled bookings cannot be cancelled again
          if (data.isCancelled) {
            throw CustomApiError.create(409, "Booking already cancelled");
          }
          // update the booking
          await FirestorePaths.Bookings(bookingId).update({
            isCancelled: true,
            cancelledOn: FieldValue.serverTimestamp(),
            lastModifiedOn: FieldValue.serverTimestamp(),
          });
          break;
        }
        case "isCleared": {
          // clear i.e. the tenant is leaving - this will free up the room for new tenants
          // in other words, tenant can exercise this only after the booking is accepted
          // unsubmitted bookings cannot be cleared (they'll be hidden from room owners)
          if (!data.isSubmitted) {
            throw CustomApiError.create(409, "Unsubmitted booking cannot be cleared");
          }
          // cancelled bookings cannot be cleared (they've already completed their lifecycle)
          if (data.isCancelled) {
            throw CustomApiError.create(409, "Cancelled booking cannot be cleared");
          }
          // only accepted bookings can be cleared (tenant must have actually occupied)
          if (data.acceptanceStatus !== BookingStatus.ACCEPTED) {
            throw CustomApiError.create(409, "Only accepted bookings can be cleared");
          }
          // cleared bookings cannot be cleared again
          if (data.isCleared) {
            throw CustomApiError.create(409, "Booking already cleared");
          }
          // update the booking
          await FirestorePaths.Bookings(bookingId).update({
            isCleared: true,
            clearedOn: FieldValue.serverTimestamp(),
            lastModifiedOn: FieldValue.serverTimestamp(),
          });
          break;
        }

        case "acceptanceStatus": {
          // accept or reject a booking - this is done only by the owner
          // accepting means room is occupied, rejecting means booking is terminated
          // only submitted bookings can be accepted or rejected
          if (!data.isSubmitted) {
            throw CustomApiError.create(409, "Only submitted bookings can be accepted or rejected");
          }
          // cancelled bookings cannot be accepted or rejected (they've already completed their lifecycle)
          if (data.isCancelled) {
            throw CustomApiError.create(409, "Cancelled booking cannot be accepted or rejected");
          }
          // cleared bookings cannot be accepted or rejected (they've already completed their lifecycle)
          if (data.isCleared) {
            throw CustomApiError.create(409, "Cleared booking cannot be accepted or rejected");
          }
          // bookings with acceptance status already set cannot be changed
          if (data.acceptanceStatus !== BookingStatus.UNSET) {
            throw CustomApiError.create(409, `Booking already ${data.acceptanceStatus.toLowerCase()}`);
          }
          if (status.value === BookingStatus.ACCEPTED) {
            // accept the booking - tenant can now occupy the room
            await FirestorePaths.Bookings(bookingId).update({
              acceptanceStatus: "ACCEPTED",
              acceptedOn: FieldValue.serverTimestamp(),
              lastModifiedOn: FieldValue.serverTimestamp(),
            });
          } else if (status.value === BookingStatus.REJECTED) {
            // reject the booking - this terminates the booking entirely
            // Note: We don't auto-cancel here to maintain clear separation of concerns
            // The client should explicitly cancel if needed, or we can handle this at the business logic layer
            await FirestorePaths.Bookings(bookingId).update({
              acceptanceStatus: BookingStatus.REJECTED,
              rejectedOn: FieldValue.serverTimestamp(),
              lastModifiedOn: FieldValue.serverTimestamp(),
            });
          }
          break;
        }
        default:
          throw CustomApiError.create(500, "Internal Server Error", "Invalid status type");
      }
    } catch (error) {
      // Only re-throw CustomApiError (business logic errors) and specific Firestore errors
      if (error instanceof CustomApiError) {
        throw error;
      }
      throw CustomApiError.create(500, "Internal Server Error", error);
    }
  }

  /**
   * Mark a booking for deletion after a set period
   */
  static async markForDelete(bookingId: string): Promise<number> {
    const data = await BookingRepo.findById(bookingId);
    if (!(data?.isCleared ?? false) && !(data?.isCancelled ?? false)) {
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
      throw CustomApiError.create(404, "Booking not found", e);
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
      throw CustomApiError.create(404, "Booking not found", e);
    }
  }

  /**
   * Immediately delete a booking
   */
  static async forceDelete(bookingId: string): Promise<void> {
    const data = await BookingRepo.findById(bookingId);
    if (!(data?.isCleared ?? false) && !(data?.isCancelled ?? false)) {
      throw CustomApiError.create(409, "Cannot delete active booking. Needs to be cleared or cancelled first");
    }
    const ref = FirestorePaths.Bookings(bookingId);
    try {
      await ref.delete();
    } catch (e) {
      throw CustomApiError.create(404, "Booking not found", e);
    }
  }
}
