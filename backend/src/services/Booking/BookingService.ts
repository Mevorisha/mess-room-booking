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
          // cancelled bookings cannot be submitted
          if (data.isCancelled) {
            throw CustomApiError.create(409, "Cancelled booking cannot be submitted");
          }
          // cleared bookings cannot be submitted
          if (data.isCleared) {
            throw CustomApiError.create(409, "Cleared booking cannot be submitted");
          }
          // accepted or rejected bookings cannot be submitted as they have already been submitted
          // they must have been submitted before as that's how acceptance status is checked before setting
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
          // in other words, tenant can exercise this only if they have submitted but their booking is not accepted yet
          // unsubmitted bookings does not need to be cancelled
          if (!data.isSubmitted) {
            throw CustomApiError.create(409, "Unsubmitted booking does not need to be cancelled");
          }
          // cleared bookings does not need to be cancelled
          if (data.isCleared) {
            throw CustomApiError.create(409, "Cleared booking does not need to be cancelled");
          }
          // accepted bookings needs to be cleared, not cancelled
          if (data.acceptanceStatus === BookingStatus.ACCEPTED) {
            throw CustomApiError.create(409, "Accepted booking cannot be cancelled. Please clear it instead");
          }
          // rejected bookings do not need to be cancelled as they are automatically cancelled
          if (data.acceptanceStatus === BookingStatus.REJECTED) {
            throw CustomApiError.create(409, "Rejected booking does not need to be cancelled");
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
          // unsubmitted bookings does not need to be cleared
          if (!data.isSubmitted) {
            throw CustomApiError.create(409, "Unsubmitted booking does not need to be cleared");
          }
          // cancelled bookings does not need to be cleared
          if (data.isCancelled) {
            throw CustomApiError.create(409, "Cancelled booking does not need to be cleared");
          }
          // unset or rejected bookings cannot be cleared
          if (data.acceptanceStatus === BookingStatus.UNSET) {
            throw CustomApiError.create(409, "Cannot clear booking that is neither accepted nor rejected");
          }
          if (data.acceptanceStatus === BookingStatus.REJECTED) {
            throw CustomApiError.create(409, "Rejected booking cannot be cleared");
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
          // accept or reject a booking - this is done only by the owner, accepting means room is occupied by occupantCount
          // in other words, owner can exercise this only if the booking is submitted
          // unsubmitted bookings does not need to be accepted or rejected
          if (!data.isSubmitted) {
            throw CustomApiError.create(409, "Unsubmitted booking does not need to be accepted or rejected");
          }
          // cancelled bookings does not need to be accepted or rejected
          if (data.isCancelled) {
            throw CustomApiError.create(409, "Cancelled booking does not need to be accepted or rejected");
          }
          // cleared bookings does not need to be accepted or rejected
          if (data.isCleared) {
            throw CustomApiError.create(409, "Cleared booking does not need to be accepted or rejected");
          }
          // accepted bookings cannot be accepted again
          if (data.acceptanceStatus === BookingStatus.ACCEPTED) {
            throw CustomApiError.create(409, "Booking already accepted");
          }
          // rejected bookings cannot be accepted again
          if (data.acceptanceStatus === BookingStatus.REJECTED) {
            throw CustomApiError.create(409, "Booking already rejected");
          }
          // if accepted, set acceptedOn timestamp
          if (status.value === "ACCEPTED") {
            await FirestorePaths.Bookings(bookingId).update({
              acceptanceStatus: "ACCEPTED",
              acceptedOn: FieldValue.serverTimestamp(),
              lastModifiedOn: FieldValue.serverTimestamp(),
            });
          }
          // if rejected, set rejectedOn timestamp and also cancel the booking
          if (status.value === "REJECTED") {
            await FirestorePaths.Bookings(bookingId).update({
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
      throw CustomApiError.create(404, "Booking not found", e);
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
