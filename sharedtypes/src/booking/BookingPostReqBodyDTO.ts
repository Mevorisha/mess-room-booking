import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { IsString, IsPositive, IsOptional, IsNotEmpty, IsInt } from "class-validator";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { Result } from "@/types/Result";
import { NetworkType } from "@/types/NetworkType";

interface ConstructorParams {
  tenantId: string;
  roomId: string;
  occupantCount: number;

  linkToWorkId?: string;
  linkToGovId?: string;
}

export class BookingPostReqBodyDTO extends ADataTransferObj {
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

  private constructor(data: ConstructorParams) {
    super();

    this.tenantId = data.tenantId;
    this.roomId = data.roomId;
    this.occupantCount = data.occupantCount;

    if (data.linkToWorkId != null) {
      this.linkToWorkId = data.linkToWorkId;
    }
    if (data.linkToGovId != null) {
      this.linkToGovId = data.linkToGovId;
    }
  }

  static override create(data: ConstructorParams): BookingPostReqBodyDTO {
    const dtoResult = this.fromJson(data);
    if (dtoResult.isErr) {
      throw dtoResult.error;
    }
    return dtoResult.value;
  }

  static override fromJson(json: NetworkType): Result<BookingPostReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConstructorParams));
  }
}
