import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useAuth from "../../hooks/auth.js";
import useNotification from "../../hooks/notification.js";

// @ts-ignore
import dpMevorisha from "../../assets/images/dpMevorisha.png";
import "./styles.css";

/**
 * @enum {"View Profile" |
 *   "Switch Profile Type" |
 *   "Update Profile Photo" |
 *   "Update ID Documents" |
 *   "Change Display Name" |
 *   "Request Password Reset" |
 *   "Change Mobile Number" |
 *   "Log Out"}
 */
export const TopBarActions = {
  VIEW_PROFILE: /**           @type {"View Profile"}           */ (
    "View Profile"
  ),
  SWITCH_PROFILE_TYPE: /**    @type {"Switch Profile Type"}    */ (
    "Switch Profile Type"
  ),
  UPDATE_PROFILE_PHOTO: /**   @type {"Update Profile Photo"}   */ (
    "Update Profile Photo"
  ),
  UPDATE_ID_DOCS: /**         @type {"Update ID Documents"}    */ (
    "Update ID Documents"
  ),
  CHANGE_NAME: /**            @type {"Change Display Name"}    */ (
    "Change Display Name"
  ),
  RESET_PASSWORD: /**         @type {"Request Password Reset"} */ (
    "Request Password Reset"
  ),
  CHANGE_MOBILE_NUMBER: /**   @type {"Change Mobile Number"}   */ (
    "Change Mobile Number"
  ),
  LOGOUT: /**                 @type {"Log Out"}                */ (
    "Log Out"
  ),
};

/**
 * @param {{ children }} props
 */
export default function TopBar({ children }) {
  const auth = useAuth();
  const notify = useNotification();

  const [dropdownState, setDropdownState] = useState(
    /** @type {"init" | "showing" | "visible" | "hiding"} */ ("init")
  );

  const [itemClicked, setItemClicked] = useState(
    /** @type {null | TopBarActions} */ (null)
  );

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!itemClicked) return;
    searchParams.set("action", itemClicked);
    setSearchParams(searchParams);

    // additonal actions to be taken based on the item clicked
    switch (itemClicked) {
      case TopBarActions.RESET_PASSWORD:
        auth.requestPasswordReset().catch((e) => notify(e.toString(), "error"));
        break;
      case TopBarActions.SWITCH_PROFILE_TYPE:
        auth
          .removeUserDetails(auth.user.uid, ["type"])
          .catch((e) => notify(e.toString(), "error"));
        break;
      case TopBarActions.LOGOUT:
        auth.logOut().catch((e) => notify(e.toString(), "error"));
        break;
      default:
        break;
    }

    setItemClicked(null);
    setDropdownState("hiding");
  }, [auth, auth.user.uid, notify, itemClicked, searchParams, setSearchParams]);

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
  const handleDropdownClick = (dropdownState) => {
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
  };

  return (
    <div className="components-TopBar">
      <div className="logo-container">
        <img src={dpMevorisha} alt="logo" />
        <h1>Mevorisha</h1>
      </div>
      <div className="section-buttons-container">{children}</div>
      <div className="action-buttons-container">
        <span>
          <i
            style={{ fontSize: "1rem" }}
            className="fa fa-bars"
            onClick={() => handleDropdownClick(dropdownState)}
          ></i>
        </span>
        <div className={`dropdown dropdown-anim-${dropdownState}`}>
          {/* View Profile */}
          <div
            className="dropdown-item"
            onClick={() => setItemClicked(TopBarActions.VIEW_PROFILE)}
          >
            View {auth.user.type === "OWNER" ? "Owner" : "Tenant"} Profile
          </div>
          {/* Switch Profile Type */}
          <div
            className="dropdown-item"
            onClick={() => setItemClicked(TopBarActions.SWITCH_PROFILE_TYPE)}
          >
            Switch to {auth.user.type === "OWNER" ? "Tenant" : "Owner"} Profile
          </div>
          {/* Update Profile Photo */}
          <div
            className="dropdown-item"
            onClick={() => setItemClicked(TopBarActions.UPDATE_PROFILE_PHOTO)}
          >
            {TopBarActions.UPDATE_PROFILE_PHOTO}
          </div>
          {/* Update ID Documents */}
          <div
            className="dropdown-item"
            onClick={() => setItemClicked(TopBarActions.UPDATE_ID_DOCS)}
          >
            {TopBarActions.UPDATE_ID_DOCS}
          </div>
          {/* Change Name */}
          <div
            className="dropdown-item"
            onClick={() => setItemClicked(TopBarActions.CHANGE_NAME)}
          >
            {TopBarActions.CHANGE_NAME}
          </div>
          {/* Request Password Reset */}
          <div
            className="dropdown-item"
            onClick={() => setItemClicked(TopBarActions.RESET_PASSWORD)}
          >
            {TopBarActions.RESET_PASSWORD}
          </div>
          {/* Change Mobile Number */}
          <div
            className="dropdown-item"
            onClick={() => setItemClicked(TopBarActions.CHANGE_MOBILE_NUMBER)}
          >
            {TopBarActions.CHANGE_MOBILE_NUMBER}
          </div>
          {/* Log Out */}
          <div
            style={{ color: "red" }}
            className="dropdown-item"
            onClick={() => setItemClicked(TopBarActions.LOGOUT)}
          >
            {TopBarActions.LOGOUT}
          </div>
        </div>
      </div>
    </div>
  );
}
