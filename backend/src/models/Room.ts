import { AcceptGender, AcceptOccupation } from "sharedtypes";
import { MultiSizePhotoModel } from "./types";

export interface RoomModel {
  id: string;
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
  // Set later on
  images?: MultiSizePhotoModel[];
  isUnavailable?: boolean;
  // 0 to 5
  rating: number;
  // AutoSetFields
  createdOn: FirebaseFirestore.Timestamp;
  lastModifiedOn: FirebaseFirestore.Timestamp;
  ttl?: FirebaseFirestore.Timestamp;
}
