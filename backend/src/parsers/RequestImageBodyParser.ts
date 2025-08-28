import fs from "fs";
import { NextApiRequest } from "next";
import formidable from "formidable";
import IncomingForm from "formidable/Formidable";
import { CustomApiError } from "@/types/CustomApiError";
import FormParseResult from "@/types/FormParseResult";

export interface ImageUploadData {
  filename?: string;
  mimetype?: string;
  buffer: Buffer<ArrayBufferLike>;
}

export class RequestImageBodyParser {
  static async parseOne(req: NextApiRequest): Promise<ImageUploadData> {
    // Parse form data
    const form: IncomingForm = formidable({ multiples: true });

    // parse the req using formidable
    const formParseResult = await new Promise<FormParseResult>((resolve, _) =>
      form.parse(req, (err, valueFields, fileFields) => void resolve({ err, valueFields, fileFields }))
    );

    const { err, fileFields } = formParseResult;

    if (err != null) {
      console.trace(err);
      throw new Error("Error parsing file");
    }

    // make sure there is atleast one field (part name) with files
    if (Object.keys(fileFields).length === 0) {
      throw CustomApiError.create(400, "No file uploaded");
    }

    // for each of the file fields store all files in an array
    const filesArr: formidable.File[] = [];
    for (const [_, files] of Object.entries(fileFields)) {
      if (files != null) filesArr.push(...files);
    }

    // since this fn does one file, if more or less, error
    if (filesArr.length !== 1) {
      throw CustomApiError.create(400, `Expected 1 file, received ${filesArr.length}`);
    }

    // get the 1st file only coz this fn does only one file
    const file = filesArr[0];
    if (file == null) {
      throw CustomApiError.create(400, "No file uploaded");
    }

    // make sure the file has usable params and exists
    if (file.filepath.length === 0 || !fs.existsSync(file.filepath)) {
      throw new Error("Missing or invalid filepath for uploaded image");
    }

    // return structured data with file buffer
    const imageUploadData: ImageUploadData = { buffer: fs.readFileSync(file.filepath) };
    if (file.originalFilename != null) {
      imageUploadData.filename = file.originalFilename;
    }
    if (file.mimetype != null) {
      imageUploadData.mimetype = file.mimetype;
    }
    return imageUploadData;
  }
}
