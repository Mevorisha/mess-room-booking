import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isEmpty } from "../../modules/util/validations.js";
import { ActionParams, PageUrls } from "../../modules/util/pageUrls.js";
import useAuth from "../../hooks/auth.js";
import useNotification from "../../hooks/notification.js";

// @ts-ignore
import dpMevorisha from "../../assets/images/dpMevorisha.png";
import "./styles.css";

/**
 * @param {{
 *   dropdownState: "init" | "showing" | "visible" | "hiding";
 *   handleDropdownClick: (dropdownState: "init" | "showing" | "visible" | "hiding") => void;
 * }} props
 */
function ActionMenu({ dropdownState, handleDropdownClick }) {
  const auth = useAuth();
  let text = "Profile Incomplete!";

  if (
    isEmpty(auth.user.photoURL) &&
    (isEmpty(auth.user.firstName) || isEmpty(auth.user.lastName))
  )
    text = "Profile Incomplete!";
  else if (isEmpty(auth.user.photoURL)) text = "Add Profile Photo!";
  else if (isEmpty(auth.user.firstName) || isEmpty(auth.user.lastName))
    text = "Add Display Name!";

  if (
    isEmpty(auth.user.photoURL) ||
    isEmpty(auth.user.firstName) ||
    isEmpty(auth.user.lastName)
  )
    return (
      <span
        className="profile-incomplete"
        onClick={() => handleDropdownClick(dropdownState)}
      >
        <span>{text}</span>
        {/* <i className="fa fa-exclamation-triangle"></i> */}
        <i className="fa fa-exclamation-circle"></i>
      </span>
    );

  return (
    <span
      className="profile-complete"
      onClick={() => handleDropdownClick(dropdownState)}
    >
      <span className="display-name">
        {auth.user.firstName} {auth.user.lastName}
      </span>
      <img className="profile-image" src={auth.user.photoURL} alt="profile" />
    </span>
  );
}

/**
 * @param {{ checkForIncompletion: any; }} props
 */
function MarkOfIncompletion({ checkForIncompletion }) {
  // returns a red exclamation mark if isEmpty(checkForIncompletion) is true
  if (isEmpty(checkForIncompletion))
    return (
      <span className="profile-incomplete">
        <i
          style={{ marginTop: "1px", fontSize: "1.1rem" }}
          className="fa fa-exclamation-circle"
        ></i>
      </span>
    );
  // else returns null
  return null;
}

/**
 * @param {{ children }} props
 */
export default function TopBar({ children }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const notify = useNotification();

  const [dropdownState, setDropdownState] = useState(
    /** @type {"init" | "showing" | "visible" | "hiding"} */ ("init")
  );

  const [searchParams] = useSearchParams();

  /**
   * @param {ActionParams} itemClicked
   */
  function handleItemClick(itemClicked) {
    if (!itemClicked) return;
    searchParams.set("action", itemClicked);

    /* redirect or take action based on the item clicked */
    switch (itemClicked) {
      // view profile action
      case ActionParams.VIEW_PROFILE:
        navigate({
          pathname: PageUrls.PROFILE,
          search: searchParams.toString(),
        });
        break;
      // onboarding actions
      case ActionParams.CHANGE_NAME:
      case ActionParams.CHANGE_MOBILE_NUMBER:
      case ActionParams.SWITCH_PROFILE_TYPE:
      case ActionParams.UPDATE_PROFILE_PHOTO:
      case ActionParams.UPDATE_ID_DOCS:
        navigate({
          pathname: PageUrls.ONBOARDING,
          search: searchParams.toString(),
        });
        break;
      // reset password action
      case ActionParams.RESET_PASSWORD:
        auth.requestPasswordReset().catch((e) => notify(e.toString(), "error"));
        searchParams.delete("action");
        break;
      // log out action
      case ActionParams.LOGOUT:
        auth.logOut().catch((e) => notify(e.toString(), "error"));
        searchParams.delete("action");
        break;
      // invalid action
      default:
        notify("Action not recognized", "error");
        break;
    }

    setDropdownState("hiding");
  }

  useEffect(() => {
    switch (dropdownState) {
      case "showing":
        setDropdownState("visible");
        break;
      case "hiding":
        setTimeout(() => setDropdownState("init"), 100);
        break;
      default:
        break;
    }
  }, [dropdownState]);

  /**
   * @param {"init" | "showing" | "visible" | "hiding"} dropdownState
   */
  function handleDropdownClick(dropdownState) {
    switch (dropdownState) {
      case "init":
        setDropdownState("showing");
        break;
      case "visible":
        setDropdownState("hiding");
        break;
      default:
        break;
    }
  }

  return (
    <div className="components-TopBar">
      <div className="logo-container">
        <img src={dpMevorisha} alt="logo" />
        <h1>Mevorisha</h1>
      </div>
      <div className="section-buttons-container">{children}</div>
      <div className="action-buttons-container">
        <ActionMenu
          dropdownState={dropdownState}
          handleDropdownClick={handleDropdownClick}
        />

        <div className={`dropdown dropdown-anim-${dropdownState}`}>
          {/* View Profile */}
          <div
            className="dropdown-item"
            onClick={() => handleItemClick(ActionParams.VIEW_PROFILE)}
          >
            View {auth.user.type === "OWNER" ? "Owner" : "Tenant"} Profile
          </div>
          {/* Switch Profile Type */}
          <div
            className="dropdown-item"
            onClick={() => handleItemClick(ActionParams.SWITCH_PROFILE_TYPE)}
          >
            Switch to {auth.user.type === "OWNER" ? "Tenant" : "Owner"} Profile
          </div>
          {/* Update Profile Photo */}
          <div
            className="dropdown-item"
            onClick={() => handleItemClick(ActionParams.UPDATE_PROFILE_PHOTO)}
          >
            {ActionParams.UPDATE_PROFILE_PHOTO}
            <MarkOfIncompletion checkForIncompletion={auth.user.photoURL} />
          </div>
          {/* Update ID Documents */}
          <div
            className="dropdown-item"
            onClick={() => handleItemClick(ActionParams.UPDATE_ID_DOCS)}
          >
            {ActionParams.UPDATE_ID_DOCS}
          </div>
          {/* Change Name */}
          <div
            className="dropdown-item"
            onClick={() => handleItemClick(ActionParams.CHANGE_NAME)}
          >
            {ActionParams.CHANGE_NAME}
            <MarkOfIncompletion
              checkForIncompletion={auth.user.firstName || auth.user.lastName}
            />
          </div>
          {/* Request Password Reset */}
          <div
            className="dropdown-item"
            onClick={() => handleItemClick(ActionParams.RESET_PASSWORD)}
          >
            {ActionParams.RESET_PASSWORD}
          </div>
          {/* Change Mobile Number */}
          <div
            className="dropdown-item"
            onClick={() => handleItemClick(ActionParams.CHANGE_MOBILE_NUMBER)}
          >
            {ActionParams.CHANGE_MOBILE_NUMBER}
          </div>
          {/* Log Out */}
          <div
            style={{ color: "red" }}
            className="dropdown-item"
            onClick={() => handleItemClick(ActionParams.LOGOUT)}
          >
            {ActionParams.LOGOUT}
          </div>
        </div>
      </div>
    </div>
  );
}
