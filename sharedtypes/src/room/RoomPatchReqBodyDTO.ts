import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { NetworkType } from "@/types/NetworkType";
import { AcceptOccupation } from "@/types/typeEnums";
import { Result } from "@/types/Result";
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNumber,
  IsPositive,
  IsOptional,
  ValidateNested,
  Max,
  Min,
} from "class-validator";
import { Base64PhotoUploadDTO } from "../types/Base64PhotoUploadDTO";
import { Type } from "class-transformer";

export enum RoomPatchParams {
  BASE_PARAMS,
  RATING,
  IS_UNAVAILABLE,
}

type BaseUpdateParams = Partial<{
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
  isUnavailable?: boolean;
  keepFiles: string[];
  addFiles: Base64PhotoUploadDTO[];
}>;

interface RatingUpdateParams {
  rating: number;
}

interface IsUnavailableUpdateParams {
  isUnavailable: boolean;
}

type ConditionalParams<T extends RoomPatchParams> = T extends RoomPatchParams.BASE_PARAMS
  ? BaseUpdateParams
  : T extends RoomPatchParams.RATING
  ? RatingUpdateParams
  : T extends RoomPatchParams.IS_UNAVAILABLE
  ? IsUnavailableUpdateParams
  : never;

/**
 * BASE PARAMS DTO
 */
class RoomPatchParamsReqBodyDTO extends ADataTransferObj {
  @IsOptional()
  @IsEnum(AcceptOccupation)
  acceptOccupation?: AcceptOccupation;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  searchTags?: string[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  landmark?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  address?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  city?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  state?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  majorTags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  minorTags?: string[];

  @IsOptional()
  @IsInt()
  @IsPositive()
  capacity?: number;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsPositive()
  pricePerOccupant?: number;

  @IsOptional()
  @IsBoolean()
  isUnavailable?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  keepFiles?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Base64PhotoUploadDTO)
  addFiles?: Base64PhotoUploadDTO[];

  private constructor(data: ConditionalParams<RoomPatchParams.BASE_PARAMS>) {
    super();

    if (data.acceptOccupation != null) {
      this.acceptOccupation = data.acceptOccupation;
    }
    if (data.searchTags != null) {
      this.searchTags = data.searchTags;
    }
    if (data.landmark != null) {
      this.landmark = data.landmark;
    }
    if (data.address != null) {
      this.address = data.address;
    }
    if (data.city != null) {
      this.city = data.city;
    }
    if (data.state != null) {
      this.state = data.state;
    }
    if (data.majorTags != null) {
      this.majorTags = data.majorTags;
    }
    if (data.minorTags != null) {
      this.minorTags = data.minorTags;
    }
    if (data.capacity != null) {
      this.capacity = data.capacity;
    }
    if (data.pricePerOccupant != null) {
      this.pricePerOccupant = data.pricePerOccupant;
    }
    if (data.isUnavailable != null) {
      this.isUnavailable = data.isUnavailable;
    }
    if (data.keepFiles != null) {
      this.keepFiles = data.keepFiles;
    }
    if (data.addFiles != null) {
      this.addFiles = data.addFiles;
    }
  }

  static override create(data: ConditionalParams<RoomPatchParams.BASE_PARAMS>): RoomPatchParamsReqBodyDTO {
    const dtoResult = this.fromJson(data);
    if (dtoResult.isErr) {
      throw dtoResult.error;
    }
    return dtoResult.value;
  }

  static override fromJson(json: NetworkType): Result<RoomPatchParamsReqBodyDTO, DtoValidationError> {
    const buildFieldResult = ADataTransferObj._buildDtoFields(json, { addFiles: Base64PhotoUploadDTO });
    if (buildFieldResult.isErr) {
      return Result.err(buildFieldResult.error);
    }
    return ADataTransferObj._fromJson(new this(json as ConditionalParams<RoomPatchParams.BASE_PARAMS>));
  }
}

/**
 * RATING DTO
 */
class RoomPatchRatingReqBodyDTO extends ADataTransferObj {
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Max(5)
  @Min(0)
  rating: number;

  private constructor(data: ConditionalParams<RoomPatchParams.RATING>) {
    super();
    this.rating = data.rating;
  }

  static override create(data: ConditionalParams<RoomPatchParams.RATING>): RoomPatchRatingReqBodyDTO {
    const dtoResult = this.fromJson(data);
    if (dtoResult.isErr) {
      throw dtoResult.error;
    }
    return dtoResult.value;
  }

  static override fromJson(json: NetworkType): Result<RoomPatchRatingReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConditionalParams<RoomPatchParams.RATING>));
  }
}

/**
 * IS_UNAVAILABLE DTO
 */
class RoomPatchIsUnavailableReqBodyDTO extends ADataTransferObj {
  @IsBoolean()
  isUnavailable: boolean;

  private constructor(data: ConditionalParams<RoomPatchParams.IS_UNAVAILABLE>) {
    super();
    this.isUnavailable = data.isUnavailable;
  }

  static override create(data: ConditionalParams<RoomPatchParams.IS_UNAVAILABLE>): RoomPatchIsUnavailableReqBodyDTO {
    const dtoResult = this.fromJson(data);
    if (dtoResult.isErr) {
      throw dtoResult.error;
    }
    return dtoResult.value;
  }

  static override fromJson(json: NetworkType): Result<RoomPatchIsUnavailableReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConditionalParams<RoomPatchParams.IS_UNAVAILABLE>));
  }
}

/**
 * TYPE MAPPING — alias to get correct DTO based on T
 */
export const RoomPatchReqBodyDTO = {
  BaseParams: RoomPatchParamsReqBodyDTO,
  Rating: RoomPatchRatingReqBodyDTO,
  IsUnavailable: RoomPatchIsUnavailableReqBodyDTO,
} as const;
