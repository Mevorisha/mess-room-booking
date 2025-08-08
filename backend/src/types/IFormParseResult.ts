import formidable from "formidable";

export default interface FormParseResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any;
  fields: formidable.Fields<string>;
  files: formidable.Files<"file">;
}
