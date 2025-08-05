import ADataTransferObj from "@/types/abstract/ADataTransferObj";
import { AcceptGender, AcceptOccupation } from "@/types/others";
import MultiSizePhotoDTO from "@/MultiSizePhotoDTO";
import RoomValidationErrors from "@/types/errors/RoomValidationErrors";
import {
  IsString,
  IsEnum,
  IsArray,
  ArrayNotEmpty,
  IsNumber,
  IsPositive,
  ValidateNested,
  IsDateString,
  IsOptional,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";

export default class RoomReqCreateDTO extends ADataTransferObj {
  @IsString({ message: RoomValidationErrors.ID_REQUIRED })
  id: string;

  @IsString({ message: RoomValidationErrors.OWNER_ID_REQUIRED })
  ownerId: string;

  @IsEnum(["MALE", "FEMALE", "OTHER"], {
    message: RoomValidationErrors.INVALID_GENDER,
  })
  acceptGender: AcceptGender;

  @IsEnum(["STUDENT", "PROFESSIONAL", "ANY"], {
    message: RoomValidationErrors.INVALID_OCCUPATION,
  })
  acceptOccupation: AcceptOccupation;

  @IsArray()
  @ArrayNotEmpty({ message: RoomValidationErrors.SEARCH_TAGS_EMPTY })
  @IsString({ each: true, message: RoomValidationErrors.SEARCH_TAGS_NOT_STRING })
  searchTags: string[];

  @IsString({ message: RoomValidationErrors.LANDMARK_REQUIRED })
  landmark: string;

  @IsString({ message: RoomValidationErrors.ADDRESS_REQUIRED })
  address: string;

  @IsString({ message: RoomValidationErrors.CITY_REQUIRED })
  city: string;

  @IsString({ message: RoomValidationErrors.STATE_REQUIRED })
  state: string;

  @IsArray()
  @ArrayNotEmpty({ message: RoomValidationErrors.MAJOR_TAGS_EMPTY })
  @IsString({ each: true })
  majorTags: string[];

  @IsArray()
  @ArrayNotEmpty({ message: RoomValidationErrors.MINOR_TAGS_EMPTY })
  @IsString({ each: true })
  minorTags: string[];

  @IsNumber({}, { message: RoomValidationErrors.CAPACITY_POSITIVE })
  @IsPositive({ message: RoomValidationErrors.CAPACITY_POSITIVE })
  capacity: number;

  @IsNumber({}, { message: RoomValidationErrors.PRICE_POSITIVE })
  @IsPositive({ message: RoomValidationErrors.PRICE_POSITIVE })
  pricePerOccupant: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MultiSizePhotoDTO)
  images: MultiSizePhotoDTO[];

  @IsNumber({}, { message: RoomValidationErrors.RATING_REQUIRED })
  rating: number;

  @IsDateString({}, { message: RoomValidationErrors.CREATED_ON_INVALID })
  createdOn: string;

  @IsDateString({}, { message: RoomValidationErrors.LAST_MODIFIED_ON_INVALID })
  lastModifiedOn: string;

  @IsOptional()
  @IsBoolean({ message: RoomValidationErrors.IS_UNAVAILABLE_INVALID })
  isUnavailable?: boolean;

  @IsOptional()
  @IsString({ message: RoomValidationErrors.TTL_INVALID })
  ttl?: string | null;

  @IsOptional()
  @IsBoolean({ message: RoomValidationErrors.IS_DELETED_INVALID })
  isDeleted?: boolean;

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
    isUnavailable?: boolean;
    ttl?: string;
    isDeleted?: boolean;
  }) {
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
    if (data.isUnavailable != null) {
      this.isUnavailable = data.isUnavailable;
    }
    if (data.ttl != null) {
      this.ttl = data.ttl;
    }
    if (data.isDeleted != null) {
      this.isDeleted = data.isDeleted;
    }
  }
}
