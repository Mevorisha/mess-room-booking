import React, { createContext, useCallback, useContext } from "react";
import UserContext from "./user.js";
import useNotification from "../hooks/notification.js";
import { EmailPasswdAuth, LinkMobileNumber } from "../modules/firebase/auth.js";
import { isEmpty } from "../modules/util/validations.js";

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

export function AccountProvider({ children }) {
  const notify = useNotification();
  const { setUser } = useContext(UserContext);

  const sendPhoneVerificationCode = useCallback(
    /**
     * @param {string} number
     * @returns {Promise<void>}
     */
    async (number) =>
      LinkMobileNumber.sendOtp(number).then(() =>
        notify("Check your mobile for OTP", "info")
      ),
    [notify]
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
            ? Promise.reject("Mobile number verification failed")
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
          notify("Unlinking existing mobile number", "info");
          await LinkMobileNumber.unlinkPhoneNumber();
          notify("Verifying new mobile number", "info");
          return LinkMobileNumber.verifyOtp(otp);
        })
        .then((phno) => setUser((user) => user.clone().setMobile(phno)))
        .then(() => notify("Mobile number verified successfully", "success")),

    [notify, setUser]
  );

  const unlinkPhoneNumber = useCallback(
    /**
     * @returns {Promise<void>}
     */
    async () =>
      LinkMobileNumber.unlinkPhoneNumber()
        .then(() => setUser((user) => user.clone().setMobile("")))
        .then(() => notify("Mobile number unlinked successfully", "success")),
    [notify, setUser]
  );

  const requestPasswordReset = useCallback(
    /**
     * @returns {Promise<void>}
     */
    async () =>
      EmailPasswdAuth.requestPasswordReset().then(() =>
        notify("Check your email for password reset link", "info")
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
