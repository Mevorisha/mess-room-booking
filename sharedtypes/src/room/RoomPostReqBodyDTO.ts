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
import { RoomPhotoUploadDTO } from "./RoomPhotoUploadDTO";
import { Type } from "class-transformer";

interface ConstructorParams {
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
  files: RoomPhotoUploadDTO[];
}

export class RoomPostReqBodyDTO extends ADataTransferObj {
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

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  minorTags: string[];

  @IsInt()
  @IsPositive()
  capacity: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsPositive()
  pricePerOccupant: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomPhotoUploadDTO)
  files: RoomPhotoUploadDTO[];

  private constructor(data: ConstructorParams) {
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
    this.minorTags = data.minorTags;
    this.capacity = data.capacity;
    this.pricePerOccupant = data.pricePerOccupant;
    this.files = data.files;
  }

  static override fromJson(json: NetworkType): Result<RoomPostReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConstructorParams));
  }

  static override toJson(dto: RoomPostReqBodyDTO): NetworkType {
    return ADataTransferObj._toJson(dto);
  }
}
