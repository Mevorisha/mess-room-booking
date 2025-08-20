import { DateTransformer } from "@/dataTransformers/DateTransformer";
import { FirebaseFirestore, FirestorePaths } from "@/firebase/init";
import { RoomModel } from "@/models/Room";
import { CustomApiError } from "@/types/CustomApiError";
import {
  QuerySortOrder,
  RoomSortFields,
  AcceptGender,
  AcceptOccupation,
  ApiResponseUrlType,
  RoomGetResBodyNotOwnerDTO,
  RoomGetResBodyOwnerDTO,
} from "sharedtypes";
import { RoomTransformer } from "./RoomTransformer";
import { Timestamp } from "firebase-admin/firestore";
import { QueryWrapper } from "@/types/QueryWrapper";

// prettier-ignore
export type RoomSearchParams = Partial<{
  ownerId: string                    | undefined;
  acceptGender: AcceptGender         | undefined;
  acceptOccupation: AcceptOccupation | undefined;
  landmark: string                   | undefined;
  city: string                       | undefined;
  state: string                      | undefined;
  capacity: number                   | undefined;
  lowPrice: number                   | undefined;
  highPrice: number                  | undefined;
  searchTags: Set<string>            | undefined;
  // probably not use | undefinedd
  createdOn: FirebaseFirestore.Timestamp      | undefined;
  lastModifiedOn: FirebaseFirestore.Timestamp | undefined;
}>;

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
  static async queryAll(
    params: RoomSearchParams,
    extUrls: ApiResponseUrlType,
    options?: { isOwner?: false; sortOn?: RoomSortFields | undefined; sortOrder?: QuerySortOrder | undefined }
  ): Promise<RoomGetResBodyNotOwnerDTO[]>;

  static async queryAll(
    params: RoomSearchParams,
    extUrls: ApiResponseUrlType,
    options?: { isOwner: true; sortOn?: RoomSortFields | undefined; sortOrder?: QuerySortOrder | undefined }
  ): Promise<RoomGetResBodyOwnerDTO[]>;

  static async queryAll(
    params: RoomSearchParams,
    extUrls: ApiResponseUrlType,
    options?: RoomQueryOptions
  ): Promise<RoomGetResBodyNotOwnerDTO[] | RoomGetResBodyOwnerDTO[]> {
    // 1. QUERY - Build and execute Firestore query
    const query = RoomSearchService.buildFirestoreQuery(params, options);
    const snapshot = await query.get();
    // 2. SORT ORDER - Apply tag-based filtering and initial sorting
    const filteredModels = RoomSearchService.firebaseFilterAndSort(snapshot.docs, params);
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
      if (errors.length !== 0) {
        if (roomDTOs.length === 0) {
          // If no room can be returned coz all are errors
          throw CustomApiError.create(500, "Internal Server Error", errors);
        } else {
          console.log(errors);
          // Return whatever was found
          return roomDTOs;
        }
      }
      return roomDTOs;
    } else {
      const roomResults = stringDateModels.map((model) => RoomGetResBodyNotOwnerDTO.fromJson(model));
      const errors = roomResults.filter((result) => result.isErr).map((result) => result.error);
      const roomDTOs = roomResults.filter((result) => result.isOk).map((result) => result.value);
      if (errors.length !== 0) {
        if (roomDTOs.length === 0) {
          // If no room can be returned coz all are errors
          throw CustomApiError.create(500, "Internal Server Error", errors);
        } else {
          console.log(errors);
          // Return whatever was found
          return roomDTOs;
        }
      }
      return roomDTOs;
    }
  }

  // ----------------------------------------------- PRIVATE HELPER FUNCTIONS ----------------------------------------------------

  // Helper function to build Firestore query
  private static buildFirestoreQuery(params: RoomSearchParams, options?: RoomQueryOptions) {
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
    if (params.createdOn != null) {
      query = query.where("createdOn", ">=", params.createdOn);
    }
    if (params.lastModifiedOn != null) {
      query = query.where("lastModifiedOn", ">=", params.lastModifiedOn);
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
      // Default sorting by lastModifiedOn
      query = query.orderBy("lastModifiedOn", QuerySortOrder.DESCENDING);
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
    params: RoomSearchParams
  ): RoomModelWithSortPrio[] {
    const results: RoomModelWithSortPrio[] = [];

    for (const doc of docs) {
      const roomModel = doc.data() as RoomModel;

      // Apply tag filtering if searchTags are provided
      if (params.searchTags != null && params.searchTags.size > 0) {
        const tagResult = RoomSearchService.getTagMatchPriority(roomModel, params.searchTags);
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
    params: RoomSearchParams,
    sortOn?: RoomSortFields
  ): RoomModel[] {
    const sortedResults = rooms.sort((a, b) => {
      // Handle owner queries: TTL rooms come last, then by lastModifiedOn desc
      if (params.ownerId != null) {
        if (a.model.ttl != null && b.model.ttl == null) return 1;
        if (a.model.ttl == null && b.model.ttl != null) return -1;
        return b.model.lastModifiedOn.toMillis() - a.model.lastModifiedOn.toMillis();
      }
      // Regular search sorting
      if (sortOn != null) {
        // If search tags were used, use sortPriority as secondary sort
        if (params.searchTags != null && params.searchTags.size > 0) {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          return (a.sortPriority ?? Number.MAX_VALUE) - (b.sortPriority ?? Number.MAX_VALUE);
        }
        // Database sorting already applied
        return 0;
      } else {
        // Sort primarily by search tag priority if used
        if (params.searchTags != null && params.searchTags.size > 0) {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          const priorityDiff = (a.sortPriority ?? Number.MAX_VALUE) - (b.sortPriority ?? Number.MAX_VALUE);
          if (priorityDiff !== 0) return priorityDiff;
        }
        // Secondary sort by lastModifiedOn desc
        return b.model.lastModifiedOn.toMillis() - a.model.lastModifiedOn.toMillis();
      }
    });
    return sortedResults.map((r) => r.model);
  }
}
