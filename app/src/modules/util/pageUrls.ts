export enum PageType {
  GO_BACK = -1,
  ROOT = "/",
  HOME = "/home",
  AUTH = "/auth",
  ONBOARDING = "/onboarding",
  PROFILE = "/profile",
  PAGE_NOT_FOUND = "/404",
}

export const PagePaths = {
  [PageType.GO_BACK]: -1,
  [PageType.ROOT]: "/",
  [PageType.HOME]: "/home",
  [PageType.AUTH]: "/auth",
  [PageType.ONBOARDING]: "/onboarding",
  [PageType.PROFILE]: "/profile",
  [PageType.PAGE_NOT_FOUND]: "/404",
};

export enum ActionType {
  VIEW_PROFILE = "ViewProfile",
  SWITCH_PROFILE_TYPE = "SwitchProfileType",
  UPDATE_PROFILE_PHOTO = "UpdateProfilePhoto",
  UPDATE_ID_DOCS = "UpdateDocuments",
  CHANGE_NAME = "ChangeDisplayName",
  RESET_PASSWORD = "RequestPasswordReset",
  CHANGE_MOBILE_NUMBER = "ChangeMobileNumber",
  CHANGE_LANGUAGE = "ChangeLanguage",
  LOGOUT = "LogOut",
}

// Multi-language support
export const ActionLabels: Record<ActionType, Record<"en" | "bn" | "hi", string>> = {
  [ActionType.VIEW_PROFILE]: {
    en: "View Profile",
    bn: "প্রোফাইল দেখুন",
    hi: "प्रोफ़ाइल देखिए",
  },
  [ActionType.SWITCH_PROFILE_TYPE]: {
    en: "Switch Profile Type",
    bn: "প্রোফাইল টাইপ পরিবর্তন করুন",
    hi: "प्रोफ़ाइल प्रकार बदलें",
  },
  [ActionType.UPDATE_PROFILE_PHOTO]: {
    en: "Update Profile Photo",
    bn: "প্রোফাইল ফটো পরিবর্তন করুন",
    hi: "प्रोफ़ाइल फोटो बदलें",
  },
  [ActionType.UPDATE_ID_DOCS]: {
    en: "Update ID Documents",
    bn: "আইডি ডকুমেন্ট পরিবর্তন করুন",
    hi: "आईडी डॉक्यूमेंट बदलें",
  },
  [ActionType.CHANGE_NAME]: {
    en: "Change Display Name",
    bn: "প্রোফাইল নাম পরিবর্তন করুন",
    hi: "प्रोफ़ाइल नाम बदलें",
  },
  [ActionType.RESET_PASSWORD]: {
    en: "Request Password Reset",
    bn: "পাসওয়ার্ড রিসেট করুন",
    hi: "पासओय़ार्ड रीसेट करें",
  },
  [ActionType.CHANGE_MOBILE_NUMBER]: {
    en: "Change Mobile Number",
    bn: "মোবাইল নাম্বার পরিবর্তন করুন",
    hi: "मोबाइल नंबर बदलें",
  },
  [ActionType.CHANGE_LANGUAGE]: {
    en: "Change Language",
    bn: "ভাষা পরিবর্তন করুন",
    hi: "भाषा बदलें",
  },
  [ActionType.LOGOUT]: {
    en: "Log Out",
    bn: "লগ আউট",
    hi: "लॉग आउट",
  },
};
