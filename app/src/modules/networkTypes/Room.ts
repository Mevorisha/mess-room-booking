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

export class RoomQueryParser {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static from(source: URLSearchParams | Record<string, any>): RoomQuery {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};
    // Extract values from URLSearchParams or regular object
    if (source instanceof URLSearchParams) {
      for (const [key, value] of source.entries()) {
        data[key] = value;
      }
    } else {
      Object.assign(data, source);
    }
    const result: RoomQuery = {};
    // Boolean field
    if (data["self"] != null) {
      result.self = String(data["self"]).toLowerCase() === "true";
    }
    // String enums - only accept valid values
    if (data["acceptGender"] != null) {
      const gender = String(data["acceptGender"]).toUpperCase();
      if (["MALE", "FEMALE", "OTHER"].includes(gender)) {
        result.acceptGender = gender as "MALE" | "FEMALE" | "OTHER";
      }
    }
    if (data["acceptOccupation"] != null) {
      const occupation = String(data["acceptOccupation"]).toUpperCase();
      if (["STUDENT", "PROFESSIONAL", "ANY"].includes(occupation)) {
        result.acceptOccupation = occupation as "STUDENT" | "PROFESSIONAL" | "ANY";
      }
    }
    // Simple string fields
    if (data["landmark"] != null) result.landmark = String(data["landmark"]);
    if (data["city"] != null) result.city = String(data["city"]);
    if (data["state"] != null) result.state = String(data["state"]);
    // Numeric fields
    if (data["capacity"] != null) {
      const capacity = Number(data["capacity"]);
      if (!isNaN(capacity)) result.capacity = capacity;
    }
    if (data["lowPrice"] != null) {
      const lowPrice = Number(data["lowPrice"]);
      if (!isNaN(lowPrice)) result.lowPrice = lowPrice;
    }
    if (data["highPrice"] != null) {
      const highPrice = Number(data["highPrice"]);
      if (!isNaN(highPrice)) result.highPrice = highPrice;
    }
    // Array field
    if (data["searchTags"] != null) {
      if (Array.isArray(data["searchTags"])) {
        result.searchTags = data["searchTags"].map(String);
      } else if (typeof data["searchTags"] === "string") {
        // Handle comma-separated tags from URL parameters
        result.searchTags = data["searchTags"].split(",").map((tag) => tag.trim());
      }
    }
    // Sorting fields
    if (data["sortOn"] != null) {
      const sortOn = String(data["sortOn"]).toLowerCase();
      if (["capacity", "rating", "priceperoccupant"].includes(sortOn)) {
        result.sortOn = sortOn as "capacity" | "rating" | "pricePerOccupant";
      }
    }
    if (data["sortOrder"] != null) {
      const sortOrder = String(data["sortOrder"]).toLowerCase();
      if (["asc", "desc"].includes(sortOrder)) {
        result.sortOrder = sortOrder as "asc" | "desc";
      }
    }
    // Page number
    if (data["page"] != null) {
      const page = Number(data["page"]);
      if (!isNaN(page)) result.page = page;
    }
    // Boolean field
    if (data["invalidateCache"] != null) {
      result.invalidateCache = String(data["invalidateCache"]).toLowerCase() === "true";
    }
    return result;
  }
}
