import React, { useCallback, useEffect, useState } from "react";
import { AuthStateEnum } from "../../contexts/auth";
import useAuth from "../../hooks/auth.js";
import useNotification from "../../hooks/notification.js";
import ButtonText from "../../components/ButtonText";

import "./styles.css";

/**
 * @param {{ auth: import("../../contexts/auth").AuthContextType }} props
 */
function SelectInitialType({ auth }) {
  const [accountType, setAccountType] = useState(
    /** @type {"TENANT" | "OWNER" | "EMPTY"} */ ("EMPTY")
  );

  const notify = useNotification();

  const updateProfileType = useCallback(
    /** @param {"TENANT" | "OWNER"} type */
    (type) => auth.updateProfileType(type),
    [auth]
  );

  useEffect(() => {
    if ("EMPTY" === accountType) return;
    console.log("Account type selected:", accountType);
    // write the account type to the database
    updateProfileType(accountType).catch((e) => notify(e.toString(), "error"));
  }, [updateProfileType, notify, accountType]);

  return (
    <div className="pages-Onboarding">
      <div className="onboarding-container">
        <h1>Choose Profile Type</h1>
        <h4>Profile type can be changed later</h4>

        <div className="desc">
          <p>If you are going to stay in a room, select Tenant.</p>
          <p> If you are the owner giving a room for rent select Owner.</p>
        </div>

        <ButtonText
          rounded="all"
          title="Tenant"
          kind="primary"
          onclick={() => setAccountType("TENANT")}
        />
        <ButtonText
          rounded="all"
          title="Owner"
          kind="primary"
          onclick={() => setAccountType("OWNER")}
        />
      </div>
    </div>
  );
}

/**
 * @param {{ auth: import("../../contexts/auth").AuthContextType }} props
 */
function SetMobileNumber({ auth }) {
  const [action, setAction] = useState(
    /** @type {"Request OTP" | "Resend OTP" | "Verify & Submit"} */ (
      "Request OTP"
    )
  );

  const notify = useNotification();

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      /** @type {string} */
      const mobile = e.target[0]?.value;
      /** @type {string} */
      const otp = e.target[1]?.value;

      // request otp
      if (mobile && (action === "Request OTP" || action === "Resend OTP")) {
        notify("Please wait while we send the OTP", "warning");
        auth
          .sendPhoneVerificationCode(mobile)
          .then(() => setAction("Verify & Submit"))
          .catch((e) => {
            setAction("Resend OTP");
            notify(e.toString(), "error");
          });
      }

      // verify otp and submit
      else if (otp && action === "Verify & Submit") {
        notify("Please wait while we verify the OTP", "warning");
        auth.verifyPhoneVerificationCode(otp).catch((e) => {
          setAction("Resend OTP");
          notify(e.toString(), "error");
        });
      }

      // invalid action
      else notify("Please enter a valid mobile number", "error");
    },
    [action, auth, notify]
  );

  return (
    <div className="pages-Onboarding">
      <div className="onboarding-container">
        <h1>Set Mobile Number</h1>
        <h4>Mobile number can be changed later</h4>

        <div className="desc">
          <p>
            Mobile number is required for communication and allows your room{" "}
            {auth.user.type === "TENANT" ? "owner" : "tenant"} to contact you.
          </p>
          {/* <h4 style={{ marginTop: "20px" }}>
            Development Phase - Testing Notes
          </h4>
          <p style={{ fontSize: "0.8rem" }}>
            - If mobile number starts with -1, send simulated will resolve,
            reject otherwise.
            <br />
            - If OTP starts with -1, verify simulated will resolve true.
            <br />
            - If OTP starts with -2, verify simulated will resolve false.
            <br />- If OTP starts with - anything else, verify simulated will
            reject.
          </p> */}
        </div>

        <form className="form-container" onSubmit={handleSubmit}>
          <input
            required
            type="tel"
            name="mobile"
            disabled={action === "Verify & Submit"}
            placeholder="Mobile with country code"
          />
          <input
            required
            type="text"
            name="otp"
            disabled={action !== "Verify & Submit"}
            placeholder={
              action === "Verify & Submit"
                ? "Enter OTP"
                : "Request an OTP first"
            }
          />
          <div className="submit-container">
            <ButtonText
              width="40%"
              rounded="all"
              title={action}
              kind="primary"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Onboarding() {
  const auth = useAuth();

  if (auth.state === AuthStateEnum.STILL_LOADING) return null;
  if (auth.user.type === "EMPTY") return <SelectInitialType auth={auth} />;
  if (!auth.user.mobile) return <SetMobileNumber auth={auth} />;

  return null;
}
