import { AcceptGender, AcceptOccupation } from "@/types/others";
import { MultiSizePhotoDTO } from "@/types/MultiSizePhotoDTO";
import { IsBoolean, IsDateString, IsOptional } from "class-validator";
import { RoomGetResBodyNotOwnerDTO } from "./RoomGetResBodyNotOwnerDTO";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { NetworkType } from "@/types/NetworkType";
import { Result } from "@/types/Result";
import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";

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

export class RoomGetResBodyOwnerDTO extends RoomGetResBodyNotOwnerDTO {
  @IsBoolean()
  isUnavailable: boolean;

  @IsOptional()
  @IsDateString()
  ttl?: string;

  @IsBoolean()
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

  static override create(data: ConstructorParams): Result<RoomGetResBodyOwnerDTO, DtoValidationError> {
    return ADataTransferObj._create(new this(data));
  }

  static override fromJson(data: NetworkType): Result<RoomGetResBodyOwnerDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(data as ConstructorParams));
  }

  static override toJson(obj: RoomGetResBodyOwnerDTO): NetworkType {
    return ADataTransferObj._toJson(obj);
  }
}
