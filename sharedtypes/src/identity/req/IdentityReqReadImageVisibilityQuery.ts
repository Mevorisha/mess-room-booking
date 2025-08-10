import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { IdentityReqValidationErrors } from "@/types/errors/req/IdentityReqValidationErrors";
import { NextJsApiReq, NextJsReqQuery } from "@/types/NextJsTypes";
import { Result } from "@/types/Result";
import { IsEnum, IsString } from "class-validator";

export class IdentityReqReadImageVisibilityQuery extends ADataTransferObj {
  @IsString({ message: IdentityReqValidationErrors.MISSING_UID })
  uid: string;

  @IsEnum(["PUBLIC", "PRIVATE"], { message: IdentityReqValidationErrors.INVALID_VISIBILITY })
  visibility: "PUBLIC" | "PRIVATE" = "PRIVATE";

  constructor(data: NextJsReqQuery) {
    super();

    this.uid = data["uid"] as string;
    this.visibility = data["visibility"] as "PUBLIC" | "PRIVATE";
  }

  static override create(req: NextJsApiReq): Result<IdentityReqReadImageVisibilityQuery, DtoValidationError> {
    return ADataTransferObj._create(new this(req.query));
  }
}
