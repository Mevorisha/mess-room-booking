import { ADataTransferObj } from "@/types/abstract/ADataTransferObj";
import { DtoValidationError } from "@/types/errors/DtoValidationError";
import { Result } from "@/types/Result";
import { IsString, IsNotEmpty, Matches } from "class-validator";
import formidable from "formidable";
import IncomingForm from "formidable/Formidable";
import PersistentFile from "formidable/PersistentFile";
import { NextJsApiReq } from "./NextJsTypes";

export enum ImageUploadErrors {
  MISSING_FILENAME = "Missing filename in uploaded image",
  INVALID_MIMETYPE = "Missing mimetype in uploaded image",
  MISSING_FILEPATH = "Missing or invalid filepath for uploaded image",
}

interface ConstructorParams {
  filename?: string;
  mimetype?: string;
  buffer: Buffer<ArrayBufferLike>;
}

export class ImageUploadederDTO extends ADataTransferObj {
  @IsString({ message: ImageUploadErrors.MISSING_FILENAME })
  @IsNotEmpty({ message: ImageUploadErrors.MISSING_FILENAME })
  filename: string;

  @IsString({ message: ImageUploadErrors.INVALID_MIMETYPE })
  @Matches(/^(image\/(jpeg|png|jpg)|application\/octet-stream)$/, {
    message: ImageUploadErrors.INVALID_MIMETYPE,
  })
  mimetype = "application/octet-stream";

  buffer: Buffer<ArrayBufferLike>;

  private constructor(data: ConstructorParams) {
    super();

    this.filename = data.filename ?? "unknown";
    this.mimetype = data.mimetype ?? "application/octet-stream";
    this.buffer = data.buffer;
  }

  /**
   * @throws {Error} if error is not DtoValidationError
   */
  static override async create(req: NextJsApiReq): Promise<Result<ImageUploadederDTO, DtoValidationError>> {
    try {
      const fileData = await ImageUploadederDTO.mkImageUploadedDtoFromReq(req);
      return ADataTransferObj._create(new this(fileData));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error instanceof DtoValidationError) {
        return Result.err(new DtoValidationError({ message: error.message }));
      } else {
        throw error;
      }
    }
  }

  private static async mkImageUploadedDtoFromReq(req: NextJsApiReq): Promise<ConstructorParams> {
    /* eslint-disable */

    // @ts-expect-error - formidable is a Node.js only dependency
    if (typeof window !== "undefined") {
      throw new Error("mkImageUploadedDtoFromReq() is only available in Node.js environment");
    }

    // Dynamic imports to avoid bundling in client-side code
    const formidable = require("formidable").default ?? require("formidable");

    // Parse form data
    const form: IncomingForm = formidable({ multiples: true });

    interface FormParseResult {
      err: Error;
      _files: formidable.Files<"file">;
    }

    const formParseResult = await new Promise<FormParseResult>((resolve, _) =>
      form.parse(req, async (err: Error, _, _files: formidable.Files<"file">) =>
        resolve({ err, _files })
      )
    );

    const { err, _files } = formParseResult;
    const files = _files as unknown as Record<string, PersistentFile[]> | null;

    if (err) {
      console.trace(err);
      throw new Error("Error parsing file");
    }

    if (!files) {
      throw new DtoValidationError({ message: "No file uploaded" });
    }

    const pfilesArr = Object.values(files).map((pfiles) => pfiles[0] as PersistentFile);

    if (pfilesArr.length !== 1) {
      throw new DtoValidationError({ message: `Expected 1 file, received ${pfilesArr.length}` });
    }

    const pfile = pfilesArr[0];
    if (!pfile) {
      throw new DtoValidationError({ message: "No file uploaded" });
    }

    const fileJson = pfile.toJSON();

    if (fileJson.filepath.length === 0 || !require("fs").existsSync(fileJson.filepath)) {
      throw new Error(ImageUploadErrors.MISSING_FILEPATH);
    }

    // Create ImageUploadedDTO from parsed file
    const imageUploadData: ConstructorParams = { buffer: require("fs").readFileSync(fileJson.filepath) };
    if (fileJson.originalFilename != null) {
      imageUploadData.filename = fileJson.originalFilename;
    }
    if (fileJson.mimetype != null) {
      imageUploadData.mimetype = fileJson.mimetype;
    }
    return imageUploadData;
  }
}
