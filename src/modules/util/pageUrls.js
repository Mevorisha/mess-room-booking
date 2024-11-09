/**
 * @enum {-1 | "/" | "/auth" | "/home" | "/onboarding" | "/profile" | "/404"}
 */
export const PageUrls = {
  GO_BACK: /**        @type {-1}            */ (-1),
  ROOT: /**           @type {"/"}           */ ("/"),
  HOME: /**           @type {"/home"}       */ ("/home"),
  AUTH: /**           @type {"/auth"}       */ ("/auth"),
  ONBOARDING: /**     @type {"/onboarding"} */ ("/onboarding"),
  PROFILE: /**        @type {"/profile"}    */ ("/profile"),
  PAGE_NOT_FOUND: /** @type {"/404"}        */ ("/404"),
};

/**
 * @enum {"View Profile" |
 *   "Switch Profile Type" |
 *   "Update Profile Photo" |
 *   "Update ID Documents" |
 *   "Change Display Name" |
 *   "Request Password Reset" |
 *   "Change Mobile Number" |
 *   "Log Out"}
 */
export const ActionParams = {
  VIEW_PROFILE: /**           @type {"View Profile"}           */ (
    "View Profile"
  ),
  SWITCH_PROFILE_TYPE: /**    @type {"Switch Profile Type"}    */ (
    "Switch Profile Type"
  ),
  UPDATE_PROFILE_PHOTO: /**   @type {"Update Profile Photo"}   */ (
    "Update Profile Photo"
  ),
  UPDATE_ID_DOCS: /**         @type {"Update ID Documents"}    */ (
    "Update ID Documents"
  ),
  CHANGE_NAME: /**            @type {"Change Display Name"}    */ (
    "Change Display Name"
  ),
  RESET_PASSWORD: /**         @type {"Request Password Reset"} */ (
    "Request Password Reset"
  ),
  CHANGE_MOBILE_NUMBER: /**   @type {"Change Mobile Number"}   */ (
    "Change Mobile Number"
  ),
  LOGOUT: /**                 @type {"Log Out"}                */ ("Log Out"),
};
