import { FirestorePaths } from "@/firebase/init";
import { RoomData, RoomCreateData, RoomUpdateData } from "@/models/Room";
import RoomValidationService from "@/services/Room/RoomValidationService";
import { FieldValue } from "firebase-admin/firestore";
import BaseRepository from "../BaseRepository";

export default class RoomRepository extends BaseRepository<RoomData, RoomCreateData, RoomUpdateData> {
  constructor() {
    super(FirestorePaths.ROOMS);
  }

  async create(roomData: RoomCreateData): Promise<string> {
    await RoomValidationService.validateUniqueRoom(roomData);

    const createData = {
      ...roomData,
      searchTags: Array.from(roomData.searchTags),
      majorTags: Array.from(roomData.majorTags),
      minorTags: Array.from(roomData.minorTags),
      rating: 0,
      isUnavailable: false,
      createdOn: FieldValue.serverTimestamp(),
      lastModifiedOn: FieldValue.serverTimestamp(),
    };

    const docRef = await this.getCollection().add(createData);
    return docRef.id;
  }

  override update(id: string, data: RoomUpdateData): Promise<void> {
    throw new Error("Method not implemented.");
  }

  override get(id: string): Promise<any> {
    throw new Error("Method not implemented.");
  }

  override delete(id: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
