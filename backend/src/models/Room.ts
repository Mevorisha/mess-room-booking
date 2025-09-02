import { AcceptGender, AcceptOccupation } from "sharedtypes";
import { MultiSizePhotoModel } from "./types";

export interface RoomModel {
  // Set via API
  ownerId: string;
  acceptGender: AcceptGender;
  acceptOccupation: AcceptOccupation;
  searchTags: string[];
  landmark: string;
  address: string;
  city: string;
  state: string;
  majorTags: string[];
  minorTags?: string[];
  capacity: number;
  pricePerOccupant: number;
  // Initialized on create
  id: string;
  rating: number;
  isUnavailable: boolean;
  // Set thru update
  images?: MultiSizePhotoModel[];
  // AutoSetFields
  createdOn: FirebaseFirestore.Timestamp;
  lastModifiedOn: FirebaseFirestore.Timestamp;
  ttl?: FirebaseFirestore.Timestamp;
}

export type RoomReadOnlyFields = "id" | "ownerId" | "acceptGender";

export interface RoomRatingsModel {
  roomId: string;
  ratingOn5: number;
}
