import { AcceptGender, AcceptOccupation } from "@/types/others";
import MultiSizePhotoDTO from "@/types/MultiSizePhotoDTO";
import RoomResValidationErrors from "@/types/errors/res/RoomResValidationErrors";
import { IsString, IsBoolean, IsOptional } from "class-validator";
import RoomResReadNotOwnerDTO from "./RoomResReadNotOwnerDTO";
import DtoValidationError from "@/types/errors/DtoValidationError";
import NetworkType from "@/types/NetworkType";
import Result from "@/types/Result";
import ADataTransferObj from "@/types/abstract/ADataTransferObj";

interface ConstructorParams {
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
}

export default class RoomResReadOwnerDTO extends RoomResReadNotOwnerDTO {
  @IsBoolean({ message: RoomResValidationErrors.IS_UNAVAILABLE_INVALID })
  isUnavailable: boolean;

  @IsOptional()
  @IsString({ message: RoomResValidationErrors.TTL_INVALID })
  ttl?: string;

  @IsBoolean({ message: RoomResValidationErrors.IS_DELETED_INVALID })
  isDeleted: boolean;

  private constructor(data: ConstructorParams) {
    const { isUnavailable, ttl, ...notOwnerData } = data;
    super(notOwnerData);

    this.isUnavailable = isUnavailable;
    if (ttl != null) {
      this.ttl = ttl;
    }
    this.isDeleted = ttl != null;
  }

  static override create(data: ConstructorParams): Result<RoomResReadOwnerDTO, DtoValidationError> {
    return ADataTransferObj._create(new this(data));
  }

  static override fromJson(data: NetworkType): Result<RoomResReadOwnerDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(data as ConstructorParams));
  }

  static override toJson(obj: RoomResReadOwnerDTO): NetworkType {
    return ADataTransferObj._toJson(obj);
  }
}
