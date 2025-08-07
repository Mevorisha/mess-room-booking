import { SchemaFields } from "@/models/Room";
import { RoomData, PseudoFields } from "@/models/Room";

export default class RoomDataTransformer {
  static toQueryableFormat(data: FirebaseFirestore.DocumentData): RoomData {
    return {
      ...data,
      searchTags: (data["searchTags"] ?? []).map((tag: string) => tag.toLowerCase()),
      majorTags: (data["majorTags"] ?? []).map((tag: string) => tag.toLowerCase()),
      minorTags: (data["minorTags"] ?? []).map((tag: string) => tag.toLowerCase()),
      landmark: data["landmark"]?.toLowerCase(),
      city: data["city"]?.toLowerCase(),
      state: data["state"]?.toLowerCase(),
      address: data["address"]?.toLowerCase(),
    };
  }

  static convertTimestamps(data: {
    createdOn?: FirebaseFirestore.Timestamp | string;
    lastModifiedOn?: FirebaseFirestore.Timestamp | string;
    ttl?: FirebaseFirestore.Timestamp | string;
  }): { createdOn?: string; lastModifiedOn?: string; ttl?: string } {
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      year: "numeric",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };

    const newData: { createdOn?: string; lastModifiedOn?: string; ttl?: string } = {};

    ["createdOn", "lastModifiedOn", "ttl"].forEach((f) => {
      const field = f as "createdOn" | "lastModifiedOn" | "ttl";
      if (data[field] != null) {
        if (typeof data[field] !== "string" && data[field] instanceof FirebaseFirestore.Timestamp) {
          newData[field] = data[field] = data[field].toDate().toLocaleDateString("en-US", dateOptions);
        }
      }
    });

    return newData;
  }

  static addPseudoFields(
    data: { id?: string; isDeleted?: boolean; rating?: number; ttl?: FirebaseFirestore.Timestamp | string },
    docId: string,
    fields: string[]
  ): void {
    if (fields.length === 0 || fields.includes(PseudoFields.ID)) {
      data.id = docId;
    }
    if (fields.length === 0 || fields.includes(PseudoFields.IS_DELETED)) {
      data.isDeleted = data.ttl != null;
    }
    if (fields.length === 0 || fields.includes(SchemaFields.RATING)) {
      if (data.rating == null) data.rating = 0;
    }
  }
}
