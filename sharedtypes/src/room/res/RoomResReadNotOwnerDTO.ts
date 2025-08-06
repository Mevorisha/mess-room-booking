import ADataTransferObj from "@/types/abstract/ADataTransferObj";
import { AcceptGender, AcceptOccupation } from "@/types/others";
import MultiSizePhotoDTO from "@/MultiSizePhotoDTO";
import RoomResValidationErrors from "@/types/errors/res/RoomResValidationErrors";
import {
  IsString,
  IsEnum,
  IsArray,
  ArrayNotEmpty,
  IsNumber,
  IsPositive,
  ValidateNested,
  IsDateString,
  validateSync,
} from "class-validator";
import { Type } from "class-transformer";
import DtoValidationError from "@/types/errors/DtoValidationError";

export default class RoomResReadNotOwnerDTO extends ADataTransferObj {
  @IsString({ message: RoomResValidationErrors.ID_REQUIRED })
  id: string;

  @IsString({ message: RoomResValidationErrors.OWNER_ID_REQUIRED })
  ownerId: string;

  @IsEnum(["MALE", "FEMALE", "OTHER"], {
    message: RoomResValidationErrors.INVALID_GENDER,
  })
  acceptGender: AcceptGender;

  @IsEnum(["STUDENT", "PROFESSIONAL", "ANY"], {
    message: RoomResValidationErrors.INVALID_OCCUPATION,
  })
  acceptOccupation: AcceptOccupation;

  @IsArray()
  @ArrayNotEmpty({ message: RoomResValidationErrors.SEARCH_TAGS_EMPTY })
  @IsString({ each: true, message: RoomResValidationErrors.SEARCH_TAGS_NOT_STRING })
  searchTags: string[];

  @IsString({ message: RoomResValidationErrors.LANDMARK_REQUIRED })
  landmark: string;

  @IsString({ message: RoomResValidationErrors.ADDRESS_REQUIRED })
  address: string;

  @IsString({ message: RoomResValidationErrors.CITY_REQUIRED })
  city: string;

  @IsString({ message: RoomResValidationErrors.STATE_REQUIRED })
  state: string;

  @IsArray()
  @ArrayNotEmpty({ message: RoomResValidationErrors.MAJOR_TAGS_EMPTY })
  @IsString({ each: true })
  majorTags: string[];

  @IsArray()
  @ArrayNotEmpty({ message: RoomResValidationErrors.MINOR_TAGS_EMPTY })
  @IsString({ each: true })
  minorTags: string[];

  @IsNumber({}, { message: RoomResValidationErrors.CAPACITY_POSITIVE })
  @IsPositive({ message: RoomResValidationErrors.CAPACITY_POSITIVE })
  capacity: number;

  @IsNumber({}, { message: RoomResValidationErrors.PRICE_POSITIVE })
  @IsPositive({ message: RoomResValidationErrors.PRICE_POSITIVE })
  pricePerOccupant: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MultiSizePhotoDTO)
  images: MultiSizePhotoDTO[];

  @IsNumber({}, { message: RoomResValidationErrors.RATING_REQUIRED })
  rating: number;

  @IsDateString({}, { message: RoomResValidationErrors.CREATED_ON_INVALID })
  createdOn: string;

  @IsDateString({}, { message: RoomResValidationErrors.LAST_MODIFIED_ON_INVALID })
  lastModifiedOn: string;

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

    const errors = validateSync(this);
    if (errors.length > 0) {
      throw new DtoValidationError(errors);
    }
  }
}
