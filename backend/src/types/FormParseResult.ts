import formidable from "formidable";

export default interface FormParseResult {
  err: unknown;
  valueFields: formidable.Fields;
  fileFields: formidable.Files;
}
