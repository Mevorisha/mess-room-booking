import formidable from "formidable";

export default interface FormParseResult {
  err: any;
  fields: formidable.Fields<string>;
  files: formidable.Files<"file">;
}
