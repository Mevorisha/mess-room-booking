import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { IdentityReqValidationErrors } from "@/types/errors/req/IdentityReqValidationErrors";
import { Result } from "@/types/Result";
import { IsNotEmpty, IsString } from "class-validator";
import { ImageUploadederDTO } from "@/types/ImageUploaderDTO";
import { NextJsApiReq, NextJsReqQuery } from "@/types/NextJsTypes";

export class IdentityReqUpdateImageBody extends ADataTransferObj {
  @IsString({ message: IdentityReqValidationErrors.MISSING_UID })
  @IsNotEmpty({ message: IdentityReqValidationErrors.MISSING_UID })
  uid: string;

  file: ImageUploadederDTO;

  private constructor(query: NextJsReqQuery, file: ImageUploadederDTO) {
    super();

    this.uid = query["uid"] as string;
    this.file = file;
  }

  /**
   * Create DTO from query and ImageUploadedDTO
   * Use this method when you already have the ImageUploadedDTO instance
   * @throws {Error} if error is not DtoValidationError - to be caught for failure at controller
   */
  static override async create(req: NextJsApiReq): Promise<Result<IdentityReqUpdateImageBody, DtoValidationError>> {
    try {
      if (typeof req.query["uid"] !== "string" || req.query["uid"].length === 0) {
        throw new DtoValidationError({ message: IdentityReqValidationErrors.MISSING_UID });
      }
      const imageUploadDto = await ImageUploadederDTO.create(req);
      if (imageUploadDto.isErr) {
        throw imageUploadDto.error;
      }
      return ADataTransferObj._create(new this(req.query, imageUploadDto.value));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error instanceof DtoValidationError) {
        return Result.err(new DtoValidationError({ message: error.message }));
      } else {
        throw error;
      }
    }
  }
}
