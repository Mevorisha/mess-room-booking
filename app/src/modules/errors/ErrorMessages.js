import { lang } from "@/modules/util/language.js";

/**
 * @enum {string}
 */
const ErrorMessages = {
  USER_NOT_LOGGED_IN: lang("User is not logged in", "ব্যবহারকারী লগইন করেননি", "उपयोगकर्ता लॉगिन नहीं है"),
  REGISTRATION_UNSUPPORTED: lang(
    "Registration is not supported",
    "রেজিস্ট্রেশন সমর্থিত নয়",
    "पंजीकरण समर्थित नहीं है"
  ),
  REGISTRATION_FAILED: lang(
    "Registration failed. Please try again",
    "রেজিস্ট্রেশন ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন",
    "पंजीकरण विफल हो गया। कृपया फिर से प्रयास करें"
  ),
  LOGIN_FAILED: lang(
    "Login failed. Please try again.",
    "লগইন ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন",
    "लॉगिन विफल हो गया। कृपया फिर से प्रयास करें"
  ),
  LOGOUT_FAILED: lang(
    "Logout failed. Please try again.",
    "লগআউট ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন",
    "लॉगआउट विफल हो गया। कृपया फिर से प्रयास करें"
  ),
  LOGGING_FAILED: lang(
    "Logging to remote server failed",
    "রিমোট সার্ভারে লগিং ব্যর্থ হয়েছে",
    "रिमोट सर्वर पर लॉगिंग विफल हो गया"
  ),
  DATA_READ_FAILED: lang(
    "Error reading data from the database",
    "ডাটাবেস থেকে ডেটা পড়তে ত্রুটি",
    "डेटाबेस से डेटा पढ़ने में त्रुटि"
  ),
  DATA_WRITE_FAILED: lang(
    "Error writing data to the database",
    "ডাটাবেসে ডেটা লিখতে ত্রুটি",
    "डेटाबेस में डेटा लिखने में त्रुटि"
  ),
  DATA_UPDATE_FAILED: lang(
    "Error updating data in the database",
    "ডাটাবেসে ডেটা আপডেট করতে ত্রুটি",
    "डेटाबेस में डेटा अपडेट करने में त्रुटि"
  ),
  DATA_DELETE_FAILED: lang(
    "Error deleting data from the database",
    "ডাটাবেস থেকে ডেটা মুছে ফেলার ত্রুটি",
    "डेटाबेस से डेटा हटाने में त्रुटि"
  ),
  UNKNOWN_ERROR: lang("An unknown error occurred", "একটি অজানা ত্রুটি ঘটেছে", "एक अज्ञात त्रुटि हुई है"),
  FILE_UPLOAD_FAILED: lang("Error uploading file", "ফাইল আপলোড করতে ত্রুটি", "फ़ाइल अपलोड करने में त्रुटि"),
  FILE_DELETE_FAILED: lang("Error deleting file", "ফাইল মুছে ফেলার ত্রুটি", "फ़ाइल हटाने में त्रुटि"),
  FILE_DOWNLOAD_FAILED: lang("Error downloading file", "ফাইল ডাউনলোড করতে ত্রুটি", "फ़ाइल डाउनलोड करने में त्रुटि"),
};

export default ErrorMessages;

/**
 * @param {any} error
 */
export function getCleanFirebaseErrMsg(error) {
  if (error.code === "auth/popup-closed-by-user") {
    return lang(
      "Popup closed by user. Please try again.",
      "পপআপ ব্যবহারকারী দ্বারা বন্ধ করা হয়েছে। দয়া করে আবার চেষ্টা করুন।",
      "पॉपअप उपयोगकर्ता द्वारा बंद कर दिया गया है। कृपया फिर से प्रयास करें।"
    );
  }
  if (error.code === "auth/user-not-found") {
    return lang(
      "User not found. Please register.",
      "ব্যবহারকারী পাওয়া যায়নি। দয়া করে রেজিস্টার করুন।",
      "उपयोगकर्ता नहीं मिला। कृपया पंजीकरण करें।"
    );
  }
  if (error.code === "auth/invalid-credential") {
    return lang(
      "Invalid credentials. Please try again.",
      "অবৈধ ক্রেডেনশিয়াল। দয়া করে আবার চেষ্টা করুন।",
      "अमान्य क्रेडेंशियल। कृपया फिर से प्रयास करें।"
    );
  }
  if (error.code === "auth/email-already-in-use") {
    return lang(
      "Email already in use. Please login.",
      "ইমেল ইতিমধ্যে ব্যবহৃত হচ্ছে। দয়া করে লগইন করুন।",
      "ईमेल पहले से उपयोग में है। कृपया लॉगिन करें।"
    );
  }
  if (error.code === "auth/account-exists-with-different-credential") {
    return lang(
      "Credentials linked to an existing account. Try a different credential.",
      "ক্রেডেনশিয়াল একটি বিদ্যমান অ্যাকাউন্টের সাথে যুক্ত। একটি ভিন্ন ক্রেডেনশিয়াল ব্যবহার করুন।",
      "क्रेडेंशियल एक मौजूदा खाते से जुड़ा हुआ है। एक अलग क्रेडेंशियल का प्रयास करें।"
    );
  }
  if (error.code === "storage/unauthorized" || error.code === "storage/unauthenticated") {
    return lang(
      "You do not have permission to perform this action.",
      "এই ক্রিয়া সম্পাদন করার অনুমতি নেই।",
      "आपके पास इस क्रिया को करने की अनुमति नहीं है।"
    );
  }
  if (error.code === "storage/canceled") {
    return lang(
      "Action canceled. Please try again.",
      "ক্রিয়া বাতিল করা হয়েছে। দয়া করে আবার চেষ্টা করুন।",
      "क्रिया रद्द कर दी गई है। कृपया फिर से प्रयास करें।"
    );
  }
  if (error.code === "storage/object-not-found") {
    return lang(
      "Resource not found or already deleted.",
      "রিসোর্স পাওয়া যায়নি অথবা ইতিমধ্যে মুছে ফেলা হয়েছে।",
      "संसाधन नहीं मिला या पहले ही हटा दिया गया है।"
    );
  }

  if (error.code.endsWith("unknown")) {
    return ErrorMessages.UNKNOWN_ERROR;
  }

  let errmsg = error.toString().replace(/FirebaseError: Firebase: (.+) \(.+\/.+\)./g, "$1");

  if (!errmsg || errmsg === "Error" || error.code.startsWith("storage/")) {
    const errcode = error.code;
    /* convert errcode from {service}/{error-code} to {Service} error: {Error code} */
    errmsg = errcode.replace(/(.+)\/(.+)/g, "$2").replace(/-/g, " ");
    /* upper case 1st char and 1st char after ": " */
    errmsg = errmsg.charAt(0).toUpperCase() + errmsg.slice(1);
    errmsg = errmsg.replace(/^(.)/g, (match) => match.toUpperCase());
  }

  return errmsg;
}
