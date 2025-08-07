import { SchemaFields } from "@/models/Room";

export default class RoomConfig {
  static readonly DELETE_TTL_DAYS = 30;
  static readonly DEFAULT_RATING = 0;
  static readonly DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
    month: "short",
    year: "numeric",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
}

export class FieldWhitelist {
  static readonly CREATE_FIELDS = [
    SchemaFields.OWNER_ID,
    SchemaFields.ACCEPT_GENDER,
    SchemaFields.ACCEPT_OCCUPATION,
    // ... other fields
  ];

  static readonly UPDATE_FIELDS = [
    SchemaFields.IMAGES,
    SchemaFields.RATING,
    SchemaFields.ACCEPT_OCCUPATION,
    // ... other fields
  ];
}
