import { AcceptGender, AcceptOccupation } from "sharedtypes";
import MultiSizePhoto from "./MultiSizePhoto";

/**
 * Room Data Transfer Object (DTO)
 * Represents the structure of a room object used in the application.
 * This is based on backend/src/models/Room.ts
 * Also see backend/src/pages/api/rooms/[roomId]/read/index.ts
 */
export default interface RoomDTO {
  id: string;
  // fields from backend/src/models/Room.ts
  ownerId: string;
  acceptGender: AcceptGender;
  acceptOccupation: AcceptOccupation;
  searchTags: string[];
  landmark: string;
  address: string;
  city: string;
  state: string;
  majorTags: string[];
  minorTags: string[];
  capacity: number;
  pricePerOccupant: number;
  images: MultiSizePhoto[];
  rating: number;
  createdOn: string;
  lastModifiedOn: string;
  // shown only to room owner
  isUnavailable?: boolean;
  ttl?: string | null;
  isDeleted?: boolean;
}
