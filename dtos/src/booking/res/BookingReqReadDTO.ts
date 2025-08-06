import ADataTransferObj from "@/types/abstract/ADataTransferObj";
import { BookingStatus } from "@/types/others";
import BookingValidationErrors from "@/types/errors/BookingValidationErrors";
import {
  IsString,
  IsEnum,
  IsNumber,
  IsPositive,
  IsOptional,
  IsBoolean,
  IsDateString,
  validateSync,
} from "class-validator";
import DtoValidationError from "@/types/errors/DtoValidationError";

export default class BookingReqCreateDTO extends ADataTransferObj {
  @IsString({ message: BookingValidationErrors.ID_REQUIRED })
  id: string;

  @IsString({ message: BookingValidationErrors.TENANT_ID_REQUIRED })
  tenantId: string;

  @IsString({ message: BookingValidationErrors.ROOM_ID_REQUIRED })
  roomId: string;

  @IsNumber({}, { message: BookingValidationErrors.OCCUPANT_COUNT_INVALID })
  @IsPositive({ message: BookingValidationErrors.OCCUPANT_COUNT_POSITIVE })
  occupantCount: number;

  @IsOptional()
  @IsString({ message: BookingValidationErrors.LINK_TO_WORK_ID_INVALID })
  linkToWorkId?: string;

  @IsOptional()
  @IsString({ message: BookingValidationErrors.LINK_TO_GOV_ID_INVALID })
  linkToGovId?: string;

  @IsEnum(["ACCEPTED", "REJECTED", "UNSET"], {
    message: BookingValidationErrors.INVALID_ACCEPTANCE_STATUS,
  })
  acceptanceStatus: BookingStatus = "UNSET";

  @IsOptional()
  @IsDateString({}, { message: BookingValidationErrors.ACCEPTED_ON_INVALID })
  acceptedOn?: string;

  @IsOptional()
  @IsDateString({}, { message: BookingValidationErrors.SUBMITTED_ON_INVALID })
  submittedOn?: string;

  @IsOptional()
  @IsDateString({}, { message: BookingValidationErrors.CANCELLED_ON_INVALID })
  cancelledOn?: string;

  @IsOptional()
  @IsDateString({}, { message: BookingValidationErrors.CLEARED_ON_INVALID })
  clearedOn?: string;

  @IsBoolean({ message: BookingValidationErrors.IS_SUBMITTED_INVALID })
  isSubmitted = false;

  @IsBoolean({ message: BookingValidationErrors.IS_CANCELLED_INVALID })
  isCancelled = false;

  @IsBoolean({ message: BookingValidationErrors.IS_CLEARED_INVALID })
  isCleared = false;

  @IsDateString({}, { message: BookingValidationErrors.CREATED_ON_INVALID })
  createdOn: string;

  @IsDateString({}, { message: BookingValidationErrors.LAST_MODIFIED_ON_INVALID })
  lastModifiedOn: string;

  @IsOptional()
  @IsString({ message: BookingValidationErrors.TTL_INVALID })
  ttl?: string;

  @IsOptional()
  @IsBoolean({ message: BookingValidationErrors.IS_DELETED_INVALID })
  isDeleted = false;

  constructor(data: {
    id: string;
    tenantId: string;
    roomId: string;
    occupantCount: number;

    linkToWorkId?: string;
    linkToGovId?: string;
    submittedOn?: string;

    acceptanceStatus: BookingStatus;
    acceptedOn?: string;

    cancelledOn?: string;
    clearedOn?: string;

    createdOn: string;
    lastModifiedOn: string;
    ttl?: string;
  }) {
    super();

    this.id = data.id;
    this.tenantId = data.tenantId;
    this.roomId = data.roomId;
    this.occupantCount = data.occupantCount;

    if (data.linkToWorkId != null) {
      this.linkToWorkId = data.linkToWorkId;
    }
    if (data.linkToGovId != null) {
      this.linkToGovId = data.linkToGovId;
    }

    this.isSubmitted = data.submittedOn != null;

    this.acceptanceStatus = data.acceptanceStatus;
    if (data.acceptedOn != null) {
      this.acceptedOn = data.acceptedOn;
    }

    this.isCancelled = data.cancelledOn != null;
    this.isCleared = data.clearedOn != null;
    if (data.submittedOn != null) {
      this.submittedOn = data.submittedOn;
    }
    if (data.cancelledOn != null) {
      this.cancelledOn = data.cancelledOn;
    }
    if (data.clearedOn != null) {
      this.clearedOn = data.clearedOn;
    }

    this.createdOn = data.createdOn;
    this.lastModifiedOn = data.lastModifiedOn;
    if (data.ttl != null) {
      this.ttl = data.ttl;
    }

    this.isDeleted = data.ttl != null;

    const errors = validateSync(this);
    if (errors.length > 0) {
      throw new DtoValidationError(errors);
    }
  }
}
