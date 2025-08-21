import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { NetworkType } from "@/types/NetworkType";
import { Result } from "@/types/Result";
import { IsNotEmpty, IsString } from "class-validator";

interface ConstructorParams {
  timestamp: string;
  message: string;
}

export class LogPostReqBodyDTO extends ADataTransferObj {
  @IsString()
  @IsNotEmpty()
  timestamp: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  private constructor(data: ConstructorParams) {
    super();

    this.timestamp = data.timestamp;
    this.message = data.message;
  }

  static override create(data: ConstructorParams): LogPostReqBodyDTO {
    const dtoResult = this.fromJson(new this(data));
    if (dtoResult.isErr) {
      throw dtoResult.error;
    }
    return dtoResult.value;
  }

  static override fromJson(json: NetworkType): Result<LogPostReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConstructorParams));
  }
}
