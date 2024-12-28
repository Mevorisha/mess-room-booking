import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageUrls } from "../../modules/util/pageUrls.js";
import useCompositeUser from "../../hooks/compositeUser.js";
import useNotification from "../../hooks/notification.js";
import ButtonText from "../../components/ButtonText";

/**
 * @returns {React.JSX.Element}
 */
export default function SetMobileNumber() {
  const compUsr = useCompositeUser();

  const [action, setAction] = useState(
    /** @type {"Request OTP" | "Resend OTP" | "Verify & Submit"} */ (
      "Request OTP"
    )
  );

  const [buttonKind, setButtonKind] = useState(
    /** @type {"primary" | "loading"} */ ("primary")
  );

  const notify = useNotification();
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();

    /** @type {string} */
    const mobile = e.target[0]?.value;
    /** @type {string} */
    const otp = e.target[1]?.value;

    // request otp
    if (mobile && (action === "Request OTP" || action === "Resend OTP")) {
      notify("Please wait while we send the OTP", "warning");
      Promise.resolve()
        .then(() => setButtonKind("loading"))
        .then(() => compUsr.accountCtx.sendPhoneVerificationCode(mobile))
        .then(() => setAction("Verify & Submit"))
        .then(() => setButtonKind("primary"))
        .catch((e) => {
          setAction("Resend OTP");
          setButtonKind("primary");
          notify(e, "error");
        });
    }

    // verify otp and submit
    else if (otp && action === "Verify & Submit") {
      notify("Please wait while we verify the OTP", "warning");
      Promise.resolve()
        .then(() => setButtonKind("loading"))
        .then(() => compUsr.accountCtx.verifyPhoneVerificationCode(otp))
        .then(() => navigate(PageUrls.HOME))
        .catch((e) => {
          setAction("Resend OTP");
          setButtonKind("primary");
          notify(e, "error");
        });
    }

    // invalid action
    else notify("Please enter a valid mobile number", "error");
  }

  return (
    <div className="pages-Onboarding">
      <div className="onboarding-container">
        <h1>Set Mobile Number</h1>
        <h4>Mobile number can be changed later</h4>

        <div className="desc">
          <p>
            Mobile number is required for communication and allows your room{" "}
            {compUsr.userCtx.user.type === "TENANT" ? "owner" : "tenant"} to
            contact you.
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
            defaultValue={compUsr.userCtx.user.mobile ?? ""}
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
              kind={buttonKind}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
