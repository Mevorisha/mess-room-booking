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

  static override create(data: ConstructorParams): Result<LogPostReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._create(new this(data));
  }

  static override fromJson(json: NetworkType): Result<LogPostReqBodyDTO, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(json as ConstructorParams));
  }

  static override toJson(obj: LogPostReqBodyDTO): NetworkType {
    return ADataTransferObj._toJson(obj);
  }
}
