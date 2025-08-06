enum IdentityImageReqValidationErrors {
  MISSING_UID = "Missing UID",
  IMAGE_SIZE_INVALID = "Images size must be 'small', 'medium' or 'large'",
  INVALID_B64_FLAG = "Base 64 flag should be true or false",
}

export default IdentityImageReqValidationErrors;
