import ADataTransferObj from "@/types/abstract/ADataTransferObj";
import DtoValidationError from "@/types/errors/DtoValidationError";
import IdentityImageReqValidationErrors from "@/types/errors/req/IdentityImageReqValidationErrors";
import { MultiSizeImageSz, NextJsReqQuery } from "@/types/others";
import { IsBoolean, IsEnum, IsString, validateSync } from "class-validator";

export default class IdentityReqReadImage extends ADataTransferObj {
  @IsString({ message: IdentityImageReqValidationErrors.MISSING_UID })
  uid: string;

  @IsEnum(["small", "medium", "large"], { message: IdentityImageReqValidationErrors.IMAGE_SIZE_INVALID })
  size: MultiSizeImageSz;

  @IsBoolean({ message: IdentityImageReqValidationErrors.INVALID_B64_FLAG })
  b64 = false;

  constructor(data: NextJsReqQuery) {
    super();

    this.uid = data["uid"] as string;
    this.size = data["size"] as MultiSizeImageSz;
    this.b64 = data["b64"] !== "true" ? true : false;

    const errors = validateSync(this);
    if (errors.length > 0) {
      throw new DtoValidationError(errors);
    }
  }
}
