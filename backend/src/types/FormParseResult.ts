import formidable from "formidable";

export default interface FormParseResult {
  err: unknown;
  fields: formidable.Fields<string>;
  files: formidable.Files<"file">;
}
