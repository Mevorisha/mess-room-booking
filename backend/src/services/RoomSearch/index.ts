import { AcceptGender, AcceptOccupation } from "sharedtypes";

export type RoomSearchParams = Partial<{
  ownerId: string;
  acceptGender: AcceptGender;
  acceptOccupation: AcceptOccupation;
  landmark: string;
  city: string;
  state: string;
  capacity: number;
  lowPrice: number;
  highPrice: number;
  searchTags: Set<string>;
  // probably not used
  createdOn: FirebaseFirestore.Timestamp;
  lastModifiedOn: FirebaseFirestore.Timestamp;
}>;

export class RoomSearchService {

}