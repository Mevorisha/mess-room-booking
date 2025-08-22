import { AcceptGender, AcceptOccupation } from "@/types/typeEnums";
import { MultiSizePhotoDTO } from "@/types/MultiSizePhotoDTO";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
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
  minorTags?: string[];
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
  @IsString()
  @IsNotEmpty()
  ttl?: string;

  @IsBoolean()
  isDeleted = false;

  protected constructor(data: ConstructorParams) {
    const { isUnavailable, ttl, ...notOwnerData } = data;
    super(notOwnerData);

    this.isUnavailable = isUnavailable;
    if (ttl != null) {
      this.ttl = ttl;
    }
    this.isDeleted = ttl != null;
  }

  static override create(data: ConstructorParams): RoomGetResBodyOwnerDTO {
    const dtoResult = this.fromJson(data);
    if (dtoResult.isErr) {
      throw dtoResult.error;
    }
    return dtoResult.value;
  }

  static override fromJson(json: NetworkType): Result<RoomGetResBodyOwnerDTO, DtoValidationError> {
    const buildFieldResult = ADataTransferObj._buildDtoFields(json, { images: MultiSizePhotoDTO });
    if (buildFieldResult.isErr) {
      return Result.err(buildFieldResult.error);
    }

    return ADataTransferObj._fromJson(new this(json as ConstructorParams));
  }

  toNotOwnerDTO(): RoomGetResBodyNotOwnerDTO {
    return new RoomGetResBodyNotOwnerDTO(this);
  }
}
