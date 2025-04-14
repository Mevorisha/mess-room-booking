import MultiSizePhoto from "./MultiSizePhoto";

export type AcceptGender = "MALE" | "FEMALE" | "OTHER";

export type AcceptOccupation = "STUDENT" | "PROFESSIONAL" | "ANY";

interface RoomData {
  ownerId: string;
  acceptGender: AcceptGender;
  acceptOccupation: AcceptOccupation;
  searchTags: Set<string>;
  landmark: string;
  address: string;
  city: string;
  state: string;
  majorTags: Set<string>;
  minorTags: Set<string>;
  capacity: number;
  pricePerOccupant: number;
  images: MultiSizePhoto[];
  isUnavailable: boolean;
  rating: number;
  createdOn: string;
  lastModifiedOn: string;
  ttl: string;
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
