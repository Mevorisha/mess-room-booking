import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { BookingStatus } from "@/types/others";
import { BookingResValidationErrors } from "@/types/errors/res/BookingResValidationErrors";
import { IsString, IsEnum, IsNumber, IsPositive, IsOptional, IsBoolean, IsDateString } from "class-validator";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { Result } from "@/types/Result";
import { NetworkType } from "@/types/NetworkType";

interface ConstructorParams {
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
}

export class BookingResCreateDTO extends ADataTransferObj {
  @IsString({ message: BookingResValidationErrors.ID_REQUIRED })
  id: string;

  @IsString({ message: BookingResValidationErrors.TENANT_ID_REQUIRED })
  tenantId: string;

  @IsString({ message: BookingResValidationErrors.ROOM_ID_REQUIRED })
  roomId: string;

  @IsNumber({}, { message: BookingResValidationErrors.OCCUPANT_COUNT_INVALID })
  @IsPositive({ message: BookingResValidationErrors.OCCUPANT_COUNT_POSITIVE })
  occupantCount: number;

  @IsOptional()
  @IsString({ message: BookingResValidationErrors.LINK_TO_WORK_ID_INVALID })
  linkToWorkId?: string;

  @IsOptional()
  @IsString({ message: BookingResValidationErrors.LINK_TO_GOV_ID_INVALID })
  linkToGovId?: string;

  @IsEnum(["ACCEPTED", "REJECTED", "UNSET"], {
    message: BookingResValidationErrors.INVALID_ACCEPTANCE_STATUS,
  })
  acceptanceStatus: BookingStatus = "UNSET";

  @IsOptional()
  @IsDateString({}, { message: BookingResValidationErrors.ACCEPTED_ON_INVALID })
  acceptedOn?: string;

  @IsOptional()
  @IsDateString({}, { message: BookingResValidationErrors.SUBMITTED_ON_INVALID })
  submittedOn?: string;

  @IsOptional()
  @IsDateString({}, { message: BookingResValidationErrors.CANCELLED_ON_INVALID })
  cancelledOn?: string;

  @IsOptional()
  @IsDateString({}, { message: BookingResValidationErrors.CLEARED_ON_INVALID })
  clearedOn?: string;

  @IsBoolean({ message: BookingResValidationErrors.IS_SUBMITTED_INVALID })
  isSubmitted = false;

  @IsBoolean({ message: BookingResValidationErrors.IS_CANCELLED_INVALID })
  isCancelled = false;

  @IsBoolean({ message: BookingResValidationErrors.IS_CLEARED_INVALID })
  isCleared = false;

  @IsDateString({}, { message: BookingResValidationErrors.CREATED_ON_INVALID })
  createdOn: string;

  @IsDateString({}, { message: BookingResValidationErrors.LAST_MODIFIED_ON_INVALID })
  lastModifiedOn: string;

  @IsOptional()
  @IsString({ message: BookingResValidationErrors.TTL_INVALID })
  ttl?: string;

  @IsOptional()
  @IsBoolean({ message: BookingResValidationErrors.IS_DELETED_INVALID })
  isDeleted = false;

  private constructor(data: ConstructorParams) {
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
  }

  static override create(data: ConstructorParams): Result<BookingResCreateDTO, DtoValidationError> {
    return ADataTransferObj._create(new this(data));
  }

  static override fromJson(data: NetworkType): Result<BookingResCreateDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(data as ConstructorParams));
  }

  static override toJson(obj: BookingResCreateDTO): NetworkType {
    return ADataTransferObj._toJson(obj);
  }
}
