import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { AcceptGender, AcceptOccupation } from "@/types/others";
import { MultiSizePhotoDTO } from "@/types/MultiSizePhotoDTO";
import {
  IsString,
  IsEnum,
  IsArray,
  ArrayNotEmpty,
  IsNumber,
  IsPositive,
  ValidateNested,
  IsDateString,
  IsNotEmpty,
  IsInt,
} from "class-validator";
import { Type } from "class-transformer";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { NetworkType } from "@/types/NetworkType";
import { Result } from "@/types/Result";

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
}

export class RoomGetResBodyNotOwnerDTO extends ADataTransferObj {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  ownerId: string;

  @IsEnum(["MALE", "FEMALE", "OTHER"])
  acceptGender: AcceptGender;

  @IsEnum(["STUDENT", "PROFESSIONAL", "ANY"])
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

  @IsNumber()
  @IsPositive()
  pricePerOccupant: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MultiSizePhotoDTO)
  images: MultiSizePhotoDTO[];

  @IsNumber()
  @IsPositive()
  rating: number;

  @IsDateString()
  createdOn: string;

  @IsDateString()
  lastModifiedOn: string;

  protected constructor(data: ConstructorParams) {
    super();

    this.id = data.id;
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
    this.images = data.images;
    this.rating = data.rating;
    this.createdOn = data.createdOn;
    this.lastModifiedOn = data.lastModifiedOn;
  }

  static override create(data: ConstructorParams): Result<RoomGetResBodyNotOwnerDTO, DtoValidationError> {
    return ADataTransferObj._create(new this(data));
  }

  static override fromJson(data: NetworkType): Result<RoomGetResBodyNotOwnerDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(data as ConstructorParams));
  }

  static override toJson(obj: RoomGetResBodyNotOwnerDTO): NetworkType {
    return ADataTransferObj._toJson(obj);
  }
}
