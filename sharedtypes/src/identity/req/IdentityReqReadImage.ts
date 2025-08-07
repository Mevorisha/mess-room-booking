import ADataTransferObj from "@/types/abstract/ADataTransferObj";
import DtoValidationError from "@/types/errors/DtoValidationError";
import IdentityImageReqValidationErrors from "@/types/errors/req/IdentityImageReqValidationErrors";
import { MultiSizeImageSz } from "@/types/MultiSizePhotoDTO";
import NetworkType from "@/types/NetworkType";
import { NextJsReqQuery } from "@/types/others";
import Result from "@/types/Result";
import { IsBoolean, IsEnum, IsString } from "class-validator";

export default class IdentityReqReadImage extends ADataTransferObj {
  @IsString({ message: IdentityImageReqValidationErrors.MISSING_UID })
  uid: string;

  @IsEnum(["small", "medium", "large"], { message: IdentityImageReqValidationErrors.IMAGE_SIZE_INVALID })
  size: MultiSizeImageSz;

  @IsBoolean({ message: IdentityImageReqValidationErrors.INVALID_B64_FLAG })
  b64 = false;

  private constructor(data: NextJsReqQuery) {
    super();

    this.uid = data["uid"] as string;
    this.size = data["size"] as MultiSizeImageSz;
    this.b64 = data["b64"] !== "true" ? true : false;
  }

  static override create(data: NextJsReqQuery): Result<IdentityReqReadImage, DtoValidationError> {
    return ADataTransferObj._create(new this(data));
  }

  static override fromJson(data: NetworkType): Result<IdentityReqReadImage, DtoValidationError> {
    return ADataTransferObj._fromJson(new this(data));
  }

  static override toJson(obj: IdentityReqReadImage): NetworkType {
    return ADataTransferObj._toJson(obj);
  }
}
