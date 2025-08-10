import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { IdentityReqValidationErrors } from "@/types/errors/req/IdentityReqValidationErrors";
import { MultiSizeImageSz } from "@/types/MultiSizePhotoDTO";
import { NextJsApiReq, NextJsReqQuery } from "@/types/NextJsTypes";
import { Result } from "@/types/Result";
import { IsBoolean, IsEnum, IsString } from "class-validator";

export class IdentityReqReadImageQuery extends ADataTransferObj {
  @IsString({ message: IdentityReqValidationErrors.MISSING_UID })
  uid: string;

  @IsEnum(["small", "medium", "large"], { message: IdentityReqValidationErrors.IMAGE_SIZE_INVALID })
  size: MultiSizeImageSz;

  @IsBoolean({ message: IdentityReqValidationErrors.INVALID_B64_FLAG })
  b64 = false;

  constructor(data: NextJsReqQuery) {
    super();

    this.uid = data["uid"] as string;
    this.size = data["size"] as MultiSizeImageSz;
    this.b64 = data["b64"] !== "true" ? true : false;
  }

  static override create(req: NextJsApiReq): Result<IdentityReqReadImageQuery, DtoValidationError> {
    return ADataTransferObj._create(new this(req.query));
  }
}
