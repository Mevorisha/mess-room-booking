import { SchemaFields } from "@/models/Booking";
import { RoomCreateData, RoomUpdateData, RoomQueryParams, PseudoFields, RoomDTO } from "@/models/Room";
import { ApiResponseUrlType } from "@/models/types";
import pickObjProps from "@/utils/pickObjProps";
import RoomDataTransformer from "./RoomDataTransformer";
import RoomQueryBuilder from "./RoomQueryBuilder";
import RoomSearchService from "./RoomSearchService";
import RoomValidationService from "./RoomValidationService";

export default class Room {
  private static repository = new RoomRepository();
  private static transformer = new RoomDataTransformer();
  private static validator = new RoomValidationService();
  private static searcher = new RoomSearchService();

  static async create(roomData: RoomCreateData): Promise<string> {
    const sanitizedData = pickObjProps(roomData, FieldWhitelist.CREATE_FIELDS) as RoomCreateData;
    return this.repository.create(sanitizedData);
  }

  static async update(roomId: string, updateData: RoomUpdateData): Promise<void> {
    const sanitizedData = pickObjProps(updateData, FieldWhitelist.UPDATE_FIELDS) as RoomUpdateData;
    return this.repository.update(roomId, sanitizedData);
  }

  static async queryAll(
    params: RoomQueryParams,
    extUrls: ApiResponseUrlType,
    sortOn?: "capacity" | "rating" | "pricePerOccupant",
    sortOrder?: "asc" | "desc",
    fields: (SchemaFields | PseudoFields)[] = []
  ): Promise<Partial<RoomDTO>[]> {
    const queryBuilder = new RoomQueryBuilder();
    // Build query using params...

    const query = queryBuilder.build();
    const snapshot = await query.get();

    const filteredRooms = this.searcher.filterByTags(snapshot.docs, params.searchTags || new Set());
    const roomDTOs = this.transformer.convertToRoomDTOs(filteredRooms, fields);

    // Apply sorting strategy based on params...
    const sortStrategy = this.getSortStrategy(params, sortOn);
    return sortStrategy.sort(roomDTOs);
  }

  private static getSortStrategy(params: RoomQueryParams, sortOn?: string): SortStrategy {
    if (params.ownerId) return new OwnerQuerySortStrategy();
    if (params.searchTags?.size) return new SearchTagSortStrategy();
    return new DefaultSortStrategy();
  }
}
