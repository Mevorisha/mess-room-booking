import { DateTransformer } from "@/dataTransformers/DateTransformer";
import { FirebaseFirestore, FirestorePaths } from "@/firebase/init";
import { RoomModel } from "@/models/Room";
import { CustomApiError } from "@/types/CustomApiError";
import {
  QuerySortOrder,
  RoomSortFields,
  ApiResponseUrlType,
  RoomGetResBodyNotOwnerDTO,
  RoomGetResBodyOwnerDTO,
  RoomGetReqQueryParamsWrapper,
  MultipleErrors,
} from "sharedtypes";
import { RoomTransformer } from "./RoomTransformer";
import { Timestamp } from "firebase-admin/firestore";
import { QueryWrapper } from "@/types/QueryWrapper";

export interface RoomQueryOptions {
  isOwner?: boolean;
  sortOn?: RoomSortFields | undefined;
  sortOrder?: QuerySortOrder | undefined;
}

interface RoomModelWithSortPrio {
  model: RoomModel;
  sortPriority: number;
  docId: string;
}

interface FirebaseQueryableData {
  searchTags: string[];
  majorTags: string[];
  minorTags: string[];
  landmark: string;
  city: string;
  state: string;
  address: string;
  createdOn: FirebaseFirestore.Timestamp;
  lastModifiedOn: FirebaseFirestore.Timestamp;
  ttl?: FirebaseFirestore.Timestamp;
}

export class RoomSearchService {
  // Number of items per page
  static readonly PAGE_SIZE = 8;

  static async queryAll(
    params: RoomGetReqQueryParamsWrapper,
    extUrls: ApiResponseUrlType,
    options?: { isOwner?: false; sortOn?: RoomSortFields | undefined; sortOrder?: QuerySortOrder | undefined }
  ): Promise<RoomGetResBodyNotOwnerDTO[]>;

  static async queryAll(
    params: RoomGetReqQueryParamsWrapper,
    extUrls: ApiResponseUrlType,
    options?: { isOwner: true; sortOn?: RoomSortFields | undefined; sortOrder?: QuerySortOrder | undefined }
  ): Promise<RoomGetResBodyOwnerDTO[]>;

  static async queryAll(
    params: RoomGetReqQueryParamsWrapper,
    extUrls: ApiResponseUrlType,
    options?: RoomQueryOptions
  ): Promise<RoomGetResBodyNotOwnerDTO[] | RoomGetResBodyOwnerDTO[]> {
    // 1. QUERY - Build and execute Firestore query
    const query = RoomSearchService.buildFirestoreQuery(params, options);
    const snapshot = await query.get();
    // 2. SORT ORDER - Apply tag-based filtering and initial sorting
    const filteredModels = RoomSearchService.firebaseFilterAndSort(snapshot.docs, params, options);
    // 4. SORT THE RESULT - Apply custom sorting logic
    const sortedModels = RoomSearchService.customSort(filteredModels, params, options?.sortOn);
    // 3. CONVERT IMAGE LINKS - Transform image paths to API URIs if needed
    const modelsWithImg = RoomSearchService.convertImageLinks(sortedModels, extUrls);
    // 4. CONVERT DATE INTO STRINGS
    const stringDateModels = modelsWithImg.map((model) => DateTransformer.transform(model));
    // 5. CONVERT INTO DTO AND RETURN
    if (options?.isOwner ?? false) {
      const roomResults = stringDateModels.map((model) => RoomGetResBodyOwnerDTO.fromJson(model));
      const errors = roomResults.filter((result) => result.isErr).map((result) => result.error);
      const roomDTOs = roomResults.filter((result) => result.isOk).map((result) => result.value);
      if (errors.length > 0) {
        if (roomDTOs.length === 0) {
          // If no room can be returned coz all are errors
          throw CustomApiError.create(500, "Internal Server Error", errors);
        } else {
          console.error("[E] [RoomSearchService] some 'RoomGetResBodyOwnerDTO' conversions failed");
          console.error(new MultipleErrors(errors));
          // Return whatever was found
          return roomDTOs;
        }
      }
      return roomDTOs;
    } else {
      const roomResults = stringDateModels.map((model) => RoomGetResBodyNotOwnerDTO.fromJson(model));
      const errors = roomResults.filter((result) => result.isErr).map((result) => result.error);
      const roomDTOs = roomResults.filter((result) => result.isOk).map((result) => result.value);
      if (errors.length > 0) {
        if (roomDTOs.length === 0) {
          // If no room can be returned coz all are errors
          throw CustomApiError.create(500, "Internal Server Error", errors);
        } else {
          console.error("[E] [RoomSearchService] some 'RoomGetResBodyNotOwnerDTO' conversions failed");
          console.error(new MultipleErrors(errors));
          // Return whatever was found
          return roomDTOs;
        }
      }
      return roomDTOs;
    }
  }

  // ----------------------------------------------- PRIVATE HELPER FUNCTIONS ----------------------------------------------------

  // Helper function to build Firestore query
  private static buildFirestoreQuery(params: RoomGetReqQueryParamsWrapper, options?: RoomQueryOptions) {
    const ref = FirebaseFirestore.collection(FirestorePaths.ROOMS);
    let query = QueryWrapper.create<RoomModel>(ref);

    // Apply filters for exact matches
    if (params.ownerId != null) {
      query = query.where("ownerId", "==", params.ownerId);
    }
    if (params.acceptGender != null) {
      query = query.where("acceptGender", "==", params.acceptGender);
    }
    if (params.acceptOccupation != null) {
      query = query.where("acceptOccupation", "==", params.acceptOccupation);
    }
    if (params.landmark != null) {
      query = query.where("landmark", "==", params.landmark);
    }
    if (params.city != null) {
      query = query.where("city", "==", params.city);
    }
    if (params.state != null) {
      query = query.where("state", "==", params.state);
    }
    if (params.capacity != null) {
      query = query.where("capacity", ">=", params.capacity);
    }
    if (params.lowPrice != null) {
      query = query.where("pricePerOccupant", ">=", params.lowPrice);
    }
    if (params.highPrice != null) {
      query = query.where("pricePerOccupant", "<=", params.highPrice);
    }

    const isOwner = options?.isOwner ?? false;
    if (!isOwner) {
      // Show non-owner only available rooms
      query = query.where("isUnavailable", "==", false);
    }

    // Apply server-side sorting
    if (options?.sortOn != null) {
      const fieldToSort = RoomSearchService.getFieldToSort(options.sortOn);
      if (fieldToSort != null) {
        query = query.orderBy(fieldToSort, options.sortOrder ?? QuerySortOrder.ASCENDING);
      }
    } else {
      /* Default sorting:
    
       * 1st sort by `createdOn`, then sort by `lastModifiedOn`.
       * This results in a list where 1st item is most recently updated. However,
       * for items with same `lastModifiedOn`, 1st item is most recently created.
       *
       * HOWEVER: for the same effect in Firestore query orderBy, `lastModifiedOn` should
       * be used as the primary sort parameter. So, w.r.t. query "syntax", the reverse
       * of the following query is actually correct:
       *
       * WRONG:
       * ```ts
       * query = query
       *   .orderBy("createdOn", QuerySortOrder.DESCENDING)
       *   .orderBy("lastModifiedOn", QuerySortOrder.DESCENDING);
       * ```
       */
      // CORRECT
      query = query
        .orderBy("lastModifiedOn", QuerySortOrder.DESCENDING) // Primary: most recent updates first
        .orderBy("createdOn", QuerySortOrder.DESCENDING); // Tiebreaker: most recent creation first
    }

    // Limit results for default queries
    if (!params.isFiltering()) {
      query = query.limit(RoomSearchService.PAGE_SIZE * 2);
    }

    return query.getQuery();
  }

  // Helper function to get the field to sort by
  private static getFieldToSort(sortOn: RoomSortFields): RoomSortFields | null {
    switch (sortOn) {
      case RoomSortFields.PRICE_PER_OCCUPANT:
        return RoomSortFields.PRICE_PER_OCCUPANT;
      case RoomSortFields.CAPACITY:
        return RoomSortFields.CAPACITY;
      case RoomSortFields.RATING:
        return RoomSortFields.RATING;
      default:
        return null;
    }
  }

  // Helper function to filter by tags and apply tag-based sorting
  private static firebaseFilterAndSort(
    docs: FirebaseFirestore.QueryDocumentSnapshot[],
    params: RoomGetReqQueryParamsWrapper,
    options?: RoomQueryOptions
  ): RoomModelWithSortPrio[] {
    const results: RoomModelWithSortPrio[] = [];

    for (const doc of docs) {
      const roomModel = doc.data() as RoomModel;

      if (!(options?.isOwner ?? false)) {
        // if not owner, skip deleted or unavailable rooms
        if (roomModel.ttl != null) {
          continue;
        }
        if (roomModel.isUnavailable) {
          continue;
        }
      }

      // Apply tag filtering if searchTags are provided
      if (params.searchTags != null && params.searchTags.length > 0) {
        const tagResult = RoomSearchService.getTagMatchPriority(roomModel, new Set(params.searchTags));
        if (!tagResult.hasMatch) continue;

        results.push({
          model: roomModel,
          sortPriority: tagResult.priority,
          docId: doc.id,
        });
      } else {
        results.push({
          model: roomModel,
          sortPriority: 0,
          docId: doc.id,
        });
      }
    }

    return results;
  }

  private static fbDataToQueryableRoomData(roomModel: RoomModel): FirebaseQueryableData {
    // deep clone room model
    const queryableData: FirebaseQueryableData = {
      // normalize arrays
      searchTags: roomModel.searchTags.map((tag) => tag.toLowerCase()),
      majorTags: roomModel.majorTags.map((tag) => tag.toLowerCase()),
      minorTags: roomModel.minorTags?.map((tag) => tag.toLowerCase()) ?? [],
      // normalize strings
      landmark: roomModel.landmark.toLowerCase(),
      city: roomModel.city.toLowerCase(),
      state: roomModel.state.toLowerCase(),
      address: roomModel.address.toLowerCase(),
      // clone timestamps (so we don’t keep original references)
      createdOn: new Timestamp(roomModel.createdOn.seconds, roomModel.createdOn.nanoseconds),
      lastModifiedOn: new Timestamp(roomModel.lastModifiedOn.seconds, roomModel.lastModifiedOn.nanoseconds),
    };
    if (roomModel.ttl != null) {
      queryableData.ttl = new Timestamp(roomModel.ttl.seconds, roomModel.ttl.nanoseconds);
    }
    return queryableData;
  }

  // Helper function to check tag matches and return priority
  private static getTagMatchPriority(
    roomData: RoomModel,
    searchTags: Set<string>
  ): { hasMatch: boolean; priority: number } {
    const queryableRoomData = RoomSearchService.fbDataToQueryableRoomData(roomData);

    for (let tag of searchTags) {
      tag = tag.toLowerCase();

      if (queryableRoomData.landmark.includes(tag)) {
        return { hasMatch: true, priority: 1 };
      } else if (queryableRoomData.city.includes(tag)) {
        return { hasMatch: true, priority: 2 };
      } else if (queryableRoomData.state.includes(tag)) {
        return { hasMatch: true, priority: 3 };
      } else if (queryableRoomData.address.includes(tag)) {
        return { hasMatch: true, priority: 4 };
      } else if (queryableRoomData.searchTags.some((t) => t.includes(tag))) {
        return { hasMatch: true, priority: 5 };
      } else if (queryableRoomData.majorTags.some((t) => t.includes(tag))) {
        return { hasMatch: true, priority: 6 };
      } else if (queryableRoomData.minorTags.some((t) => t.includes(tag))) {
        return { hasMatch: true, priority: 7 };
      }
    }

    return { hasMatch: false, priority: Number.MAX_VALUE };
  }

  // Helper function to convert image links
  private static convertImageLinks(roomModels: RoomModel[], extUrls: ApiResponseUrlType): RoomModel[] {
    if (extUrls === ApiResponseUrlType.API_URI) {
      return roomModels.map((model) => RoomTransformer.imgConvertGsPathToApiUri(model, model.id));
    }
    return roomModels;
  }

  // Helper function to apply final sorting
  private static customSort(
    rooms: RoomModelWithSortPrio[],
    params: RoomGetReqQueryParamsWrapper,
    sortOn?: RoomSortFields
  ): RoomModel[] {
    const LAST_MODIFIED_THRESHOLD_MS = 5000; // 5 seconds

    // Helper function for time-based sorting with tiebreaker
    function diffTime(roomA: RoomModelWithSortPrio, roomB: RoomModelWithSortPrio): number {
      const lastModifiedDiff = roomB.model.lastModifiedOn.toMillis() - roomA.model.lastModifiedOn.toMillis();
      // Use createdOn as tiebreaker if lastModifiedOn times are within 1 hour
      if (Math.abs(lastModifiedDiff) < LAST_MODIFIED_THRESHOLD_MS) {
        return roomB.model.createdOn.toMillis() - roomA.model.createdOn.toMillis();
      }
      return lastModifiedDiff;
    }

    // Helper function for TTL-based sorting (TTL rooms come last)
    function diffTTL(roomA: RoomModelWithSortPrio, roomB: RoomModelWithSortPrio): number {
      const aHasTTL = roomA.model.ttl != null;
      const bHasTTL = roomB.model.ttl != null;
      if (aHasTTL && !bHasTTL) return 1; // a has TTL, b doesn't - a comes after b
      if (!aHasTTL && bHasTTL) return -1; // b has TTL, a doesn't - a comes before b
      return 0; // Both have TTL or both don't have TTL - no preference
    }

    // Helper function for IsUnavailable-based sorting (Unavailable rooms come last)
    function diffIsUnavailable(roomA: RoomModelWithSortPrio, roomB: RoomModelWithSortPrio): number {
      const aIsUnavailable = roomA.model.isUnavailable;
      const bIsUnavailable = roomB.model.isUnavailable;
      if (aIsUnavailable && !bIsUnavailable) return 1; // a is unavailable, b isn't - a comes after b
      if (!aIsUnavailable && bIsUnavailable) return -1; // b is unavailable, a isn't - a comes before b
      return 0; // Both unavailable or available - no preference
    }

    // Helper function for search tag priority sorting with time tiebreaker
    function diffPriorityTag(roomA: RoomModelWithSortPrio, roomB: RoomModelWithSortPrio): number {
      return roomA.sortPriority - roomB.sortPriority;
    }

    // Search tags
    const hasSearchTags = params.searchTags != null && params.searchTags.length > 0;

    // Apply sorting
    const sortedResults = rooms.sort((roomA, roomB) => {
      // Handle owner queries: TTL rooms come last, then unavailable rooms, then sort by time
      if (params.ownerId != null) {
        const ttlDiff = diffTTL(roomA, roomB);
        const unavailableDiff = diffIsUnavailable(roomA, roomB);
        return ttlDiff !== 0 ? ttlDiff : unavailableDiff !== 0 ? unavailableDiff : diffTime(roomA, roomB);
      }
      // Regular search sorting
      if (sortOn != null) {
        // If search tags were used, use sortPriority as secondary sort
        if (hasSearchTags) {
          const priorityDiff = diffPriorityTag(roomA, roomB);
          // If priorityDiff is 0, don't change order (or else it'll mess up db applied order)
          return priorityDiff !== 0 ? priorityDiff : 0;
        }
        // Database sorting already applied
        return 0;
      } else {
        // Sort primarily by search tag priority if used
        if (hasSearchTags) {
          const priorityDiff = diffPriorityTag(roomA, roomB);
          return priorityDiff !== 0 ? priorityDiff : diffTime(roomA, roomB);
        }
        // Secondary sort by lastModifiedOn desc
        return diffTime(roomA, roomB);
      }
    });
    return sortedResults.map((r) => r.model);
  }
}
