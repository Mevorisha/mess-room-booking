import { BookingStatus } from "sharedtypes";

export interface BookingModel {
  tenantId: string;
  roomId: string;
  occupantCount: number;
  linkToWorkId?: string;
  linkToGovId?: string;
  // initialize on create
  id: string;
  // these properties can be set ony once
  isSubmitted: boolean;
  acceptanceStatus: BookingStatus;
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
