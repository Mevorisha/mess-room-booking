import { RoomDTO } from "@/models/Room";

export default interface RoomSortStrategy {
  sort(rooms: { dto: Partial<RoomDTO>; sortPriority: number }[]): Partial<RoomDTO>[];
}

export class OwnerQuerySortStrategy implements RoomSortStrategy {
  sort(rooms: { dto: Partial<RoomDTO>; sortPriority: number }[]): Partial<RoomDTO>[] {
    return rooms
      .sort((a, b) => {
        if (a.dto.ttl != null && b.dto.ttl == null) return 1;
        if (a.dto.ttl == null && b.dto.ttl != null) return -1;

        if (a.dto.lastModifiedOn && b.dto.lastModifiedOn) {
          return new Date(b.dto.lastModifiedOn).getTime() - new Date(a.dto.lastModifiedOn).getTime();
        }
        return 0;
      })
      .map((r) => r.dto);
  }
}

export class SearchTagSortStrategy implements RoomSortStrategy {
  sort(rooms: { dto: Partial<RoomDTO>; sortPriority: number }[]): Partial<RoomDTO>[] {
    return rooms
      .sort((a, b) => {
        const priorityDiff = (a.sortPriority ?? Number.MAX_VALUE) - (b.sortPriority ?? Number.MAX_VALUE);
        if (priorityDiff !== 0) return priorityDiff;

        if (a.dto.lastModifiedOn && b.dto.lastModifiedOn) {
          return new Date(b.dto.lastModifiedOn).getTime() - new Date(a.dto.lastModifiedOn).getTime();
        }
        return 0;
      })
      .map((r) => r.dto);
  }
}
