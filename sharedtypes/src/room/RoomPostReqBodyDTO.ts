import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { NetworkType } from "@/types/NetworkType";
import { Result } from "@/types/Result";
import { AcceptGender, AcceptOccupation } from "@/types/typeEnums";
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";
import { Base64PhotoUploadDTO } from "../types/Base64PhotoUploadDTO";
import { Type } from "class-transformer";

interface ConstructorParamsNoFiles {
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
}

interface ConstructorParamsWithFiles extends ConstructorParamsNoFiles {
  files: Base64PhotoUploadDTO[];
}

type ConstructorParams<T extends "files" | "nofiles"> = T extends "nofiles"
  ? ConstructorParamsNoFiles
  : ConstructorParamsWithFiles;

export class RoomPostReqBodyOmitFilesDTO extends ADataTransferObj {
  @IsOptional()
  @IsString()
  ownerId: string;

  @IsEnum(AcceptGender)
  acceptGender: AcceptGender;

  @IsEnum(AcceptOccupation)
  acceptOccupation: AcceptOccupation;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  searchTags: string[];

  @IsString()
  @IsNotEmpty()
  landmark: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  majorTags: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  minorTags?: string[];

  @IsInt()
  @IsPositive()
  capacity: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsPositive()
  pricePerOccupant: number;

  protected constructor(data: ConstructorParams<"nofiles">) {
    super();

    this.ownerId = data.ownerId;
    this.acceptGender = data.acceptGender;
    this.acceptOccupation = data.acceptOccupation;
    this.searchTags = data.searchTags;
    this.landmark = data.landmark;
    this.address = data.address;
    this.city = data.city;
    this.state = data.state;
    this.majorTags = data.majorTags;
    if (data.minorTags != null) {
      this.minorTags = data.minorTags;
    }
    this.capacity = data.capacity;
    this.pricePerOccupant = data.pricePerOccupant;
  }

  static override fromJson(json: NetworkType): Result<RoomPostReqBodyOmitFilesDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConstructorParams<"nofiles">));
  }
}

export class RoomPostReqBodyDTO extends RoomPostReqBodyOmitFilesDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Base64PhotoUploadDTO)
  files: Base64PhotoUploadDTO[];

  private constructor(data: ConstructorParams<"files">) {
    super(data);
    this.files = data.files;
  }

  static override fromJson(json: NetworkType): Result<RoomPostReqBodyDTO, DtoValidationError> {
    const buildResult = ADataTransferObj._buildDtoFields(json, { files: Base64PhotoUploadDTO });
    if (buildResult.isErr) {
      throw buildResult.error;
    }
    return ADataTransferObj._fromJson(new this(json as ConstructorParams<"files">));
  }

  getFiles(): Base64PhotoUploadDTO[] {
    return this.files;
  }

  omitFiles(): RoomPostReqBodyOmitFilesDTO {
    return new RoomPostReqBodyOmitFilesDTO(this);
  }
}
