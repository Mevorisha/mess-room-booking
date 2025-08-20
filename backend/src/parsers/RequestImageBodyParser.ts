import fs from "fs";
import { NextApiRequest } from "next";
import formidable from "formidable";
import IncomingForm from "formidable/Formidable";
import PersistentFile from "formidable/PersistentFile";
import { CustomApiError } from "@/types/CustomApiError";
import FormParseResult from "@/types/FormParseResult";

export interface ImageUploadData {
  filename?: string;
  mimetype?: string;
  buffer: Buffer<ArrayBufferLike>;
}

export class RequestImageBodyParser {
  static async parse(req: NextApiRequest): Promise<ImageUploadData> {
    // Parse form data
    const form: IncomingForm = formidable({ multiples: true });

    const formParseResult = await new Promise<FormParseResult>((resolve, _) =>
      form.parse(req, (err, fields, files) => void resolve({ err, fields, files }))
    );

    const { err, files: _files } = formParseResult;
    const files = _files as unknown as Record<string, PersistentFile[]> | null;

    if (err != null) {
      console.trace(err);
      throw new Error("Error parsing file");
    }

    if (files == null) {
      throw CustomApiError.create(400, "No file uploaded");
    }

    const pfilesArr = Object.values(files).map((pfiles) => pfiles[0] as PersistentFile);

    if (pfilesArr.length !== 1) {
      throw CustomApiError.create(400, `Expected 1 file, received ${pfilesArr.length}`);
    }

    const pfile = pfilesArr[0];
    if (pfile == null) {
      throw CustomApiError.create(400, "No file uploaded");
    }

    const fileJson = pfile.toJSON();

    if (fileJson.filepath.length === 0 || !fs.existsSync(fileJson.filepath)) {
      throw new Error("Missing or invalid filepath for uploaded image");
    }

    // Create ImageUploadedDTO from parsed file
    const imageUploadData: ImageUploadData = { buffer: fs.readFileSync(fileJson.filepath) };
    if (fileJson.originalFilename != null) {
      imageUploadData.filename = fileJson.originalFilename;
    }
    if (fileJson.mimetype != null) {
      imageUploadData.mimetype = fileJson.mimetype;
    }
    return imageUploadData;
  }
}
