import MultiSizePhoto from "./MultiSizePhoto";

export type AcceptGender = "MALE" | "FEMALE" | "OTHER";

export type AcceptOccupation = "STUDENT" | "PROFESSIONAL" | "ANY";

export interface RoomData {
  id?: string;
  ownerId: string;
  images: MultiSizePhoto[];
  isUnavailable: boolean;
  acceptGender: AcceptGender | null;
  acceptOccupation: AcceptOccupation | null;
  searchTags: string[];
  landmark: string;
  address: string;
  city: string;
  state: string;
  majorTags: string[];
  minorTags: string[];
  capacity: number;
  pricePerOccupant: number;
  rating: number;
  isDeleted?: boolean;
  createdOn: string;
  lastModifiedOn: string;
  ttl?: string;
}

type RoomNetworkType = Partial<RoomData>;

export default RoomNetworkType;

export interface RoomQuery {
  self?: boolean;
  acceptGender?: "MALE" | "FEMALE" | "OTHER";
  acceptOccupation?: "STUDENT" | "PROFESSIONAL" | "ANY";
  landmark?: string;
  city?: string;
  state?: string;
  capacity?: number;
  lowPrice?: number;
  highPrice?: number;
  searchTags?: string[];
  sortOn?: "capacity" | "rating" | "pricePerOccupant";
  sortOrder?: "asc" | "desc";
  page?: number;
  invalidateCache?: boolean;
}
