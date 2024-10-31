import React, { useEffect, useState } from "react";
import useAuth from "../../hooks/auth.js";
import useNotification from "../../hooks/notification.js";

// @ts-ignore
import dpMevorisha from "../../assets/images/dpMevorisha.png";
import "./styles.css";

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
    /** @type {null | "View Profile" | "Change Name" | "Change Password" | "Change Mobile Number"| "Change profile type" | "Change profile picture" | "Logout"} */ (
      null
    )
  );

  useEffect(() => {
    if (itemClicked) {
      switch (itemClicked) {
        case "View Profile":
          break;
        case "Change Name":
          break;
        case "Change Password":
          auth
            .requestPasswordReset()
            .catch((e) => notify(e.toString(), "error"));
          break;
        case "Change Mobile Number":
          auth
            .unlinkPhoneNumber()
            .then(() => notify("Mobile number unlinked", "info"))
            .catch((e) => notify(e.toString(), "error"));
          break;
        case "Change profile type":
          auth
            .removeUserDetails(auth.user.uid, ["type"])
            .catch((e) => notify(e.toString(), "error"));
          break;
        case "Change profile picture":
          break;
        case "Logout":
          auth.logOut().catch((e) => notify(e.toString(), "error"));
          break;
        default:
          break;
      }

      setItemClicked(null);
      setDropdownState("hiding");
    }
  }, [auth, auth.user.uid, notify, itemClicked]);

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
          <div
            className="dropdown-item"
            onClick={() => setItemClicked("View Profile")}
          >
            {`View ${auth.user.type === "OWNER" ? "Owner" : "Tenant"} profile`}
          </div>
          <div
            className="dropdown-item"
            onClick={() => setItemClicked("Change profile type")}
          >
            {`Switch to ${
              auth.user.type === "OWNER" ? "Tenant" : "Owner"
            } profile`}
          </div>
          <div
            className="dropdown-item"
            onClick={() => setItemClicked("Change Name")}
          >
            Change display name
          </div>
          <div
            className="dropdown-item"
            onClick={() => setItemClicked("Change Password")}
          >
            Request password change
          </div>
          <div
            className="dropdown-item"
            onClick={() => setItemClicked("Change Mobile Number")}
          >
            Change mobile number
          </div>
          <div
            className="dropdown-item"
            onClick={() => setItemClicked("Change profile picture")}
          >
            Change profile picture
          </div>
          <div
            className="dropdown-item"
            onClick={() => setItemClicked("Logout")}
            style={{ color: "red" }}
          >
            Log out
          </div>
        </div>
      </div>
    </div>
  );
}
