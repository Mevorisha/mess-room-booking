import { AcceptGender, AcceptOccupation } from "@/types/others";
import MultiSizePhotoDTO from "@/types/MultiSizePhotoDTO";
import RoomResValidationErrors from "@/types/errors/res/RoomResValidationErrors";
import { IsString, IsBoolean, IsOptional, validateSync } from "class-validator";
import RoomResReadNotOwnerDTO from "./RoomResReadNotOwnerDTO";
import DtoValidationError from "@/types/errors/DtoValidationError";

export default class RoomResReadOwnerDTO extends RoomResReadNotOwnerDTO {
  @IsBoolean({ message: RoomResValidationErrors.IS_UNAVAILABLE_INVALID })
  isUnavailable: boolean;

  @IsOptional()
  @IsString({ message: RoomResValidationErrors.TTL_INVALID })
  ttl?: string;

  @IsBoolean({ message: RoomResValidationErrors.IS_DELETED_INVALID })
  isDeleted: boolean;

  constructor(data: {
    // additional field
    id: string;
    // fields from backend/src/models/Room.ts
    ownerId: string;
    acceptGender: AcceptGender;
    acceptOccupation: AcceptOccupation;
    searchTags: string[];
    landmark: string;
    address: string;
    city: string;
    state: string;
    majorTags: string[];
    minorTags: string[];
    capacity: number;
    pricePerOccupant: number;
    images: MultiSizePhotoDTO[];
    rating: number;
    createdOn: string;
    lastModifiedOn: string;
    // only shown to owners
    isUnavailable: boolean;
    ttl?: string;
  }) {
    const { isUnavailable, ttl, ...notOwnerData } = data;
    super(notOwnerData);

    this.isUnavailable = isUnavailable;
    if (ttl != null) {
      this.ttl = ttl;
    }
    this.isDeleted = ttl != null;

    const errors = validateSync(this);
    if (errors.length > 0) {
      throw new DtoValidationError(errors);
    }
  }
}
