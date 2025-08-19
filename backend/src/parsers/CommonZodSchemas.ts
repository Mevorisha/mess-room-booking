import { LogType } from "@/models/Logs";
import { RoomSortFields, QuerySortOrder } from "sharedtypes";
import { AcceptGender, AcceptOccupation, MultiSizeImageSz } from "sharedtypes";
import z from "zod";

export const CommonZodSchemas = {
  Basic: {
    UNDEFINED: z.undefined(),
    STRING: z.string().nonempty(),
    STRING_NONEMPTY: z.string().nonempty(),
    STRING_NONEMPTY_OPTIONAL: z.string().nonempty().optional(),
    BOOL: z.boolean(),
    BOOL_OPTIONAL_DEFAULT: z.boolean().optional().default(false),
    UID: z.string().nonempty(),
    BASE_64: z.base64().nonempty(),
    INT_POSITIVE: z.int().positive(),
    INT_NONNEG: z.int().min(0),
    NUM_POSITIVE: z.number().positive(),
    NUM_NONNEG: z.number().min(0),
  },

  Enum: {
    IMGSIZE: z.enum(MultiSizeImageSz),
    LOGTYPE: z.enum(LogType),
    ACCEPT_GENDER: z.enum(AcceptGender),
    ACCEPT_OCCUPATION: z.enum(AcceptOccupation),
  },

  QueryParam: {
    COMMASEP: z
      .string()
      .optional()
      .transform((val) => (val != null ? new Set(val.split(",").filter(Boolean)) : void 0))
      .optional(),

    OPTIONAL_BOOL: z
      .string()
      .optional()
      .transform((val) => val === "true" || val === "1")
      .optional(),

    SORT_ORDER: z.enum(QuerySortOrder).optional().default(QuerySortOrder.ASCENDING),
    ROOM_SORT_FIELDS: z.enum(RoomSortFields).optional(),

    NUM: z
      .string()
      .optional()
      .transform((val) => (val != null ? parseFloat(val) : void 0))
      .optional(),
    INT: z
      .string()
      .optional()
      .transform((val) => (val != null ? parseInt(val, 10) : void 0))
      .optional(),
  },
};
