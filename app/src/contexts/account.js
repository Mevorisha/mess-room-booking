import React, { createContext, useCallback, useContext } from "react";
import UserContext from "./user.js";
import useNotification from "../hooks/notification.js";
import { EmailPasswdAuth, LinkMobileNumber } from "../modules/firebase/auth.js";
import { isEmpty } from "../modules/util/validations.js";
import { lang } from "../modules/util/language.js";
import { ApiPaths, apiPostOrPatchJson } from "../modules/util/api.js";

/* ---------------------------------- AUTH CONTEXT OBJECT ----------------------------------- */

/**
 * @typedef  {Object} AccountContextType
 * @property {(number: string) => Promise<void>} sendPhoneVerificationCode
 * @property {(otp: string)    => Promise<void>} verifyPhoneVerificationCode
 * @property {()               => Promise<void>} unlinkPhoneNumber
 * @property {()               => Promise<void>} requestPasswordReset
 */

const AccountContext = createContext(
  /** @type {AccountContextType} */ ({
    sendPhoneVerificationCode: async () => {},
    verifyPhoneVerificationCode: async () => {},
    unlinkPhoneNumber: async () => {},
    requestPasswordReset: async () => {},
  })
);

export default AccountContext;

/* ------------------------------------ ACCOUNT PROVIDER COMPONENT ----------------------------------- */

/**
 * @param {{ children: any }} props
 * @returns {React.JSX.Element}
 */
export function AccountProvider({ children }) {
  const notify = useNotification();
  const { user, dispatchUser } = useContext(UserContext);

  const sendPhoneVerificationCode = useCallback(
    /**
     * @param {string} number
     * @returns {Promise<void>}
     */
    async (number) =>
      LinkMobileNumber.sendOtp(number).then(() =>
        notify(
          lang("Check your mobile for OTP", "ও-টি-পি এর জন্য আপনার মোবাইল দেখুন", "ओ-टी-पी के लिए आपका मोबाइल देखें"),
          "info"
        )
      ),
    [notify]
  );

  const unlinkPhoneNumber = useCallback(
    /**
     * @returns {Promise<void>}
     */
    async () =>
      LinkMobileNumber.unlinkPhoneNumber()
        .then(() => dispatchUser({ mobile: "" }))
        .then(() =>
          notify(
            lang(
              "Mobile number unlinked successfully",
              "মোবাইল নম্বর সফলভাবে আনলিঙ্ক করা হয়েছে",
              "मोबाइल नंबर सफलतापूर्वक अनलिंक किया गया"
            ),
            "success"
          )
        ),
    [notify, dispatchUser]
  );

  const verifyPhoneVerificationCode = useCallback(
    /**
     * @param {string} otp
     * @returns {Promise<void>}
     */
    async (otp) =>
      LinkMobileNumber.verifyOtp(otp)
        .then((phno) =>
          isEmpty(phno)
            ? Promise.reject(
                lang("Mobile number verification failed", "মোবাইল নম্বর ভেরিফিকেশন ফেইল", "मोबाइल नंबर भेरिफिकेशन फेल")
              )
            : Promise.resolve(phno)
        )
        .catch(async (error) => {
          if (
            !(
              error.toString().toLowerCase().includes("provider") &&
              error.toString().toLowerCase().includes("already") &&
              error.toString().toLowerCase().includes("linked")
            )
          ) {
            return Promise.reject(error);
          }
          notify(
            lang(
              "Unlinking existing mobile number",
              "মোবাইল নম্বর আনলিঙ্ক করা হচ্ছে",
              "मोबाइल नंबर अनलिंक किया जा रहा है"
            ),
            "info"
          );
          await unlinkPhoneNumber();
          notify(
            lang(
              "Verifying new mobile number",
              "নতুন মোবাইল নম্বর ভেরিফাই করা হচ্ছে",
              "नए मोबाइल नंबर वेरिफाई किया जा रहा है"
            ),
            "info"
          );
          return LinkMobileNumber.verifyOtp(otp);
        })
        .then(async (phno) => {
          await apiPostOrPatchJson("PATCH", ApiPaths.Profile.updateMobile(user.uid), { mobile: phno });
          dispatchUser({ mobile: phno });
        })
        .then(() =>
          notify(
            lang(
              "Mobile number verified successfully",
              "মোবাইল নম্বর সফলভাবে ভেরিফাই করা হয়েছে",
              "मोबाइल नंबर सफलतापूर्वक वेरिफाई किया गया है"
            ),
            "success"
          )
        )
        .catch((e) => notify(e, "error")),

    [user.uid, notify, dispatchUser, unlinkPhoneNumber]
  );

  const requestPasswordReset = useCallback(
    /**
     * @returns {Promise<void>}
     */
    async () =>
      EmailPasswdAuth.requestPasswordReset().then(() =>
        notify(
          lang(
            "Check your email for password reset link",
            "পাসওয়ার্ড রিসেট লিঙ্কের জন্য আপনার ইমেল চেক করুন",
            "पासवर्ड रीसेट लिंक के लिए अपना ईमेल चेक करें"
          ),
          "info"
        )
      ),
    [notify]
  );

  return (
    <AccountContext.Provider
      value={{
        sendPhoneVerificationCode,
        verifyPhoneVerificationCode,
        unlinkPhoneNumber,
        requestPasswordReset,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}
