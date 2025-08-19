import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { BookingStatus } from "@/types/typeEnums";
import { IsString, IsEnum, IsPositive, IsOptional, IsBoolean, IsDateString, IsNotEmpty, IsInt } from "class-validator";
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

export class BookingGetResBodyDTO extends ADataTransferObj {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsInt()
  @IsPositive()
  occupantCount: number;

  @IsOptional()
  @IsString()
  linkToWorkId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  linkToGovId?: string;

  @IsEnum(BookingStatus)
  acceptanceStatus: BookingStatus = BookingStatus.UNSET;

  @IsOptional()
  @IsDateString()
  acceptedOn?: string;

  @IsOptional()
  @IsDateString()
  submittedOn?: string;

  @IsOptional()
  @IsDateString()
  cancelledOn?: string;

  @IsOptional()
  @IsDateString()
  clearedOn?: string;

  @IsBoolean()
  isSubmitted = false;

  @IsBoolean()
  isCancelled = false;

  @IsBoolean()
  isCleared = false;

  @IsDateString()
  createdOn: string;

  @IsDateString()
  lastModifiedOn: string;

  @IsOptional()
  @IsDateString()
  ttl?: string;

  @IsBoolean()
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

  static override fromJson(json: NetworkType): Result<BookingGetResBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConstructorParams));
  }
}
