import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isEmpty } from "../../modules/util/validations.js";
import { lang } from "../../modules/util/language.js";
import { ActionParams, PageUrls } from "../../modules/util/pageUrls.js";
import ImageLoader from "../ImageLoader";
import useCompositeUser from "../../hooks/compositeUser.js";
import useNotification from "../../hooks/notification.js";

// @ts-ignore
import dpMevorisha from "../../assets/images/dpMevorisha.png";
import "./styles.css";

/**
 * @param {{
 *   dropdownState: "init" | "showing" | "visible" | "hiding";
 *   handleDropdownClick: (dropdownState: "init" | "showing" | "visible" | "hiding") => void;
 * }} props
 * @returns {React.JSX.Element}
 */
function ActionMenu({ dropdownState, handleDropdownClick }) {
  const compUsr = useCompositeUser();
  // prettier-ignore
  let text = lang("Profile Incomplete!", "প্রোফাইল অসম্পূর্ণ!", "प्रोफ़ाइल अपूर्ण!");

  if (
    isEmpty(compUsr.userCtx.user.profilePhotos) &&
    (isEmpty(compUsr.userCtx.user.firstName) ||
      isEmpty(compUsr.userCtx.user.lastName))
  )
    // prettier-ignore
    text = lang("Profile Incomplete!", "প্রোফাইল অসম্পূর্ণ!", "प्रोफ़ाइल अपूर्ण!");
  else if (isEmpty(compUsr.userCtx.user.profilePhotos))
    // prettier-ignore
    text = lang("Add Profile Photo!", "প্রোফাইল ফটো দিন!", "प्रोफ़ाइल फोटो दें!");
  else if (
    isEmpty(compUsr.userCtx.user.firstName) ||
    isEmpty(compUsr.userCtx.user.lastName)
  )
    // prettier-ignore
    text = lang("Add Display Name!", "প্রোফাইল নাম দিন!", "प्रोफ़ाइल नाम जोड़ें!");

  if (
    isEmpty(compUsr.userCtx.user.profilePhotos) ||
    isEmpty(compUsr.userCtx.user.firstName) ||
    isEmpty(compUsr.userCtx.user.lastName)
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
        {compUsr.userCtx.user.firstName} {compUsr.userCtx.user.lastName}
      </span>
      <ImageLoader
        className="profile-image"
        src={compUsr.userCtx.user.profilePhotos?.small || ""}
        alt="profile"
      />
    </span>
  );
}

/**
 * @param {{ isIncomplete: boolean; }} props
 * @returns {React.JSX.Element | null}
 */
function MarkOfIncompletion({ isIncomplete }) {
  // returns a red exclamation mark if isIncomplete true
  if (!isIncomplete) return null;
  return (
    <span className="profile-incomplete">
      <i
        style={{ marginTop: "1px", fontSize: "1.1rem" }}
        className="fa fa-exclamation-circle"
      ></i>
    </span>
  );
}

/**
 * @param {{ children: any }} props
 * @returns {React.JSX.Element}
 */
export default function TopBar({ children }) {
  const compUsr = useCompositeUser();
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
      case ActionParams.CHANGE_LANGUAGE:
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
        compUsr.accountCtx
          .requestPasswordReset()
          .catch((e) => notify(e, "error"));
        searchParams.delete("action");
        break;
      // log out action
      case ActionParams.LOGOUT:
        compUsr.authCtx.logOut().catch((e) => notify(e, "error"));
        searchParams.delete("action");
        break;
      // invalid action
      default:
        notify(
          lang("Action not recognized", "অবৈধ ক্রিয়া!", "अवैध कार्य"),
          "error"
        );
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
        <ImageLoader src={dpMevorisha} alt="logo" />
        <h1>{lang("Mevorisha", "মেভোরিশা", "मेभोरिशा")}</h1>
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
            {
              /* prettier-ignore */ compUsr.userCtx.user.type === "OWNER"
              ? lang("View Owner Profile", "মালিকের প্রোফাইল দেখুন", "मालिक प्रोफ़ाइल देखें")
              : lang("View Tenant Profile", "ভাড়াটের প্রোফাইল দেখুন", "किरायेदार प्रोफ़ाइल देखें")
            }
          </div>
          {/* Switch Profile Type */}
          <div
            className="dropdown-item"
            onClick={() => handleItemClick(ActionParams.SWITCH_PROFILE_TYPE)}
          >
            {
              /* prettier-ignore */ compUsr.userCtx.user.type === "OWNER"
              ? lang("Switch to Tenant Profile", "ভাড়াটের প্রোফাইলে স্যুইচ করুন", "किरायेदार पर स्विच करें")
              : lang("Switch to Owner Profile", "মালিকের প্রোফাইলে স্যুইচ করুন", "मालिक पर स्विच करें")
            }
          </div>
          {/* Update Profile Photo */}
          <div
            className="dropdown-item"
            onClick={() => handleItemClick(ActionParams.UPDATE_PROFILE_PHOTO)}
          >
            {ActionParams.UPDATE_PROFILE_PHOTO}
            <MarkOfIncompletion
              isIncomplete={isEmpty(compUsr.userCtx.user.profilePhotos)}
            />
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
              isIncomplete={
                isEmpty(compUsr.userCtx.user.firstName) ||
                isEmpty(compUsr.userCtx.user.lastName)
              }
            />
          </div>
          {/* Change Mobile Number */}
          <div
            className="dropdown-item"
            onClick={() => handleItemClick(ActionParams.CHANGE_MOBILE_NUMBER)}
          >
            {ActionParams.CHANGE_MOBILE_NUMBER}
          </div>
          {/* Request Password Reset */}
          <div
            className="dropdown-item"
            onClick={() => handleItemClick(ActionParams.RESET_PASSWORD)}
          >
            {ActionParams.RESET_PASSWORD}
          </div>
          {/* Change Language */}
          <div
            className="dropdown-item"
            onClick={() => handleItemClick(ActionParams.CHANGE_LANGUAGE)}
          >
            {ActionParams.CHANGE_LANGUAGE}
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
