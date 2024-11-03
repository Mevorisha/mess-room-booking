import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { loadFileFromFilePicker } from "../../modules/firebase/storage.js";
import { AuthStateEnum } from "../../contexts/auth";
import { isEmpty } from "../../modules/util/validations.js";
import { TopBarActions } from "../../components/TopBar";
import PageNotFound from "../PageNotFound";
import useAuth from "../../hooks/auth.js";
import useNotification from "../../hooks/notification.js";
import ButtonText from "../../components/ButtonText";

// @ts-ignore
import dpGeneric from "../../assets/images/dpGeneric.png";
import "./styles.css";

/**
 * @param {{ auth: import("../../contexts/auth").AuthContextType }} props
 */
function SelectInitialType({ auth }) {
  const notify = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSubmit = useCallback(
    /**
     * @param {"TENANT" | "OWNER"} type
     */
    (type) => {
      auth
        .updateProfileType(type)
        .then(() => searchParams.delete("action"))
        .then(() => setSearchParams(searchParams))
        .catch((e) => notify(e.toString(), "error"));
    },
    [auth, notify, searchParams, setSearchParams]
  );

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
          onclick={() => handleSubmit("TENANT")}
        />
        <ButtonText
          rounded="all"
          title="Owner"
          kind="primary"
          onclick={() => handleSubmit("OWNER")}
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
  const [searchParams, setSearchParams] = useSearchParams();

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
        auth
          .verifyPhoneVerificationCode(otp)
          .then(() => searchParams.delete("action"))
          .then(() => setSearchParams(searchParams))
          .catch((e) => {
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

/**
 * @param {{ auth: import("../../contexts/auth").AuthContextType }} props
 */
function SetProfilePhoto({ auth }) {
  const [photoURL, setPhotoURL] = useState(dpGeneric);

  const notify = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();

  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

  const handleUpdatePhoto = useCallback(() => {
    loadFileFromFilePicker("image/*", maxSizeInBytes)
      .then((file) => auth.updateProfilePhoto(file))
      .then((url) => setPhotoURL(url))
      .then(() => searchParams.delete("action"))
      .then(() => setSearchParams(searchParams))
      .catch((e) => notify(e.toString(), "error"));
  }, [auth, notify, searchParams, setSearchParams, maxSizeInBytes]);

  return (
    <div className="pages-Onboarding">
      <div className="onboarding-container">
        <h1>Set Profile Photo</h1>
        <h4>Photo can be changed later</h4>

        <div className="desc">
          <p>
            Photo is required for identification and allows your room{" "}
            {auth.user.type === "TENANT" ? "owner" : "tenant"} to recognize you.
          </p>
        </div>

        <div className="photo-container">
          <img
            src={auth.user.photoURL || photoURL || dpGeneric}
            alt="profile"
          />
          <ButtonText
            rounded="all"
            title="Update Photo"
            kind="primary"
            onclick={handleUpdatePhoto}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{ auth: import("../../contexts/auth").AuthContextType }} props
 */
function SetDisplayName({ auth }) {
  const notify = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleUpdateName = useCallback(
    (e) => {
      e.preventDefault();

      /** @type {string} */
      const firstName = e.target[0]?.value;
      /** @type {string} */
      const lastName = e.target[1]?.value;

      if (firstName && lastName)
        auth
          .updateProfileName(firstName, lastName)
          .then(() => searchParams.delete("action"))
          .then(() => setSearchParams(searchParams))
          .catch((e) => notify(e.toString(), "error"));
      else notify("Please enter a valid name", "error");
    },
    [auth, notify, searchParams, setSearchParams]
  );

  return (
    <div className="pages-Onboarding">
      <div className="onboarding-container">
        <h1>Set Display Name</h1>
        <h4>Name can be changed later</h4>

        <div className="desc">
          <p>
            Name is required for identification and allows your room{" "}
            {auth.user.type === "TENANT" ? "owner" : "tenant"} to address you.
          </p>
        </div>

        <form className="form-container" onSubmit={handleUpdateName}>
          <input
            required
            type="text"
            name="firstName"
            placeholder="First Name"
            defaultValue={
              isEmpty(auth.user.firstName) ? "" : auth.user.firstName
            }
          />
          <input
            required
            type="text"
            name="lastName"
            placeholder="Last Name"
            defaultValue={
              1 && isEmpty(auth.user.lastName) ? "" : auth.user.lastName
            }
          />
          <div className="submit-container">
            <ButtonText
              width="40%"
              rounded="all"
              title="Update Name"
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
  const [searchParams] = useSearchParams();

  if (searchParams.has("action"))
    switch (searchParams.get("action")) {
      case TopBarActions.SWITCH_PROFILE_TYPE:
        return <SelectInitialType auth={auth} />;
      case TopBarActions.CHANGE_NAME:
        return <SetDisplayName auth={auth} />;
      case TopBarActions.CHANGE_MOBILE_NUMBER:
        return <SetMobileNumber auth={auth} />;
      case TopBarActions.UPDATE_PROFILE_PHOTO:
        return <SetProfilePhoto auth={auth} />;
      default:
        return <PageNotFound />;
    }

  if (auth.state === AuthStateEnum.STILL_LOADING) return null;
  if (isEmpty(auth.user.type)) return <SelectInitialType auth={auth} />;
  if (isEmpty(auth.user.mobile)) return <SetMobileNumber auth={auth} />;
  if (isEmpty(auth.user.photoURL)) return <SetProfilePhoto auth={auth} />;
  if (isEmpty(auth.user.firstName) || isEmpty(auth.user.lastName))
    return <SetDisplayName auth={auth} />;

  return <PageNotFound />;
}
