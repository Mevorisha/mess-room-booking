import { lang } from "./language.js";

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
 *   "Change Language" |
 *   "Log Out"}
 */
// prettier-ignore
export const ActionParams = {
  VIEW_PROFILE: /**           @type {"View Profile"}           */ (
    lang("View Profile", "প্রোফাইল দেখুন", "प्रोफ़ाइल देखिए")
  ),
  SWITCH_PROFILE_TYPE: /**    @type {"Switch Profile Type"}    */ (
    lang("Switch Profile Type", "প্রোফাইল টাইপ পরিবর্তন করুন", "प्रोफ़ाइल प्रकार बदलें")
  ),
  UPDATE_PROFILE_PHOTO: /**   @type {"Update Profile Photo"}   */ (
    lang("Update Profile Photo", "প্রোফাইল ফটো পরিবর্তন করুন", "प्रोफ़ाइल फोटो बदलें")
  ),
  UPDATE_ID_DOCS: /**         @type {"Update ID Documents"}    */ (
    lang("Update ID Documents", "আইডি ডকুমেন্ট পরিবর্তন করুন", "आईडी डॉक्यूमेंट बदलें")
  ),
  CHANGE_NAME: /**            @type {"Change Display Name"}    */ (
    lang("Change Display Name", "প্রোফাইল নাম পরিবর্তন করুন", "प्रोफ़ाइल नाम बदलें")
  ),
  RESET_PASSWORD: /**         @type {"Request Password Reset"} */ (
    lang("Request Password Reset", "পাসওয়ার্ড রিসেট করুন", "पासओय़ार्ड रीसेट करें")
  ),
  CHANGE_MOBILE_NUMBER: /**   @type {"Change Mobile Number"}   */ (
    lang("Change Mobile Number", "মোবাইল নাম্বার পরিবর্তন করুন", "मोबाइल नंबर बदलें")
  ),
  CHANGE_LANGUAGE: /**        @type {"Change Language"}        */ (
    lang("Change Language", "ভাষা পরিবর্তন করুন", "भाषा बदलें")
  ),
  LOGOUT: /**                 @type {"Log Out"}                 */ (
    lang("Log Out", "লগ আউট", "लॉग आउट")
  ),
};
