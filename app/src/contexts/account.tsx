import React, { createContext, useCallback, useContext } from "react";
import UserContext from "./user.jsx";
import useNotification from "@/hooks/notification.js";
import { EmailPasswdAuth, LinkMobileNumber } from "@/modules/firebase/auth.js";
import { isEmpty } from "@/modules/util/validations.js";
import { lang } from "@/modules/util/language.js";
import { ApiPaths, apiPostOrPatchJson } from "@/modules/util/api.js";

/* ---------------------------------- AUTH CONTEXT OBJECT ----------------------------------- */

export interface AccountContextType {
  sendPhoneVerificationCode: (number: string) => Promise<void>;
  verifyPhoneVerificationCode: (otp: string) => Promise<void>;
  unlinkPhoneNumber: () => Promise<void>;
  requestPasswordReset: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType>({
  sendPhoneVerificationCode: async () => Promise.reject(new Error()),
  verifyPhoneVerificationCode: async () => Promise.reject(new Error()),
  unlinkPhoneNumber: async () => Promise.reject(new Error()),
  requestPasswordReset: async () => Promise.reject(new Error()),
});

export default AccountContext;

/* ------------------------------------ ACCOUNT PROVIDER COMPONENT ----------------------------------- */

export function AccountProvider({ children }: { children: React.JSX.Element }): React.JSX.Element {
  const notify = useNotification();
  const { user, dispatchUser } = useContext(UserContext);

  const sendPhoneVerificationCode = useCallback(
    async (number: string): Promise<void> =>
      LinkMobileNumber.sendOtp(number).then(() =>
        notify(
          lang("Check your mobile for OTP", "ও-টি-পি এর জন্য আপনার মোবাইল দেখুন", "ओ-टी-पी के लिए आपका मोबाइल देखें"),
          "info"
        )
      ),
    [notify]
  );

  const unlinkPhoneNumber = useCallback(
    async (): Promise<void> =>
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
    [dispatchUser, notify]
  );

  const verifyPhoneVerificationCode = useCallback(
    async (otp: string): Promise<void> =>
      LinkMobileNumber.verifyOtp(otp)
        .then((phno) =>
          isEmpty(phno)
            ? Promise.reject(
                new Error(
                  lang(
                    "Mobile number verification failed",
                    "মোবাইল নম্বর ভেরিফিকেশন ফেইল",
                    "मोबाइल नंबर भेरिफिकेशन फेल"
                  )
                )
              )
            : Promise.resolve(phno)
        )
        .catch(async (error: Error) => {
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
        .catch((e: Error) => notify(e, "error")),

    [user.uid, notify, dispatchUser, unlinkPhoneNumber]
  );

  const requestPasswordReset = useCallback(
    async (): Promise<void> =>
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
