import React, { useEffect, useState } from "react";
import useAuth from "../../hooks/auth.js";
import ButtonText from "../../components/ButtonText";

// @ts-ignore
import dpMevorisha from "../../assets/images/dpMevorisha.png";
import "./styles.css";

/**
 * @param {{ children }} props
 */
function TopBar({ children }) {
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
          break;
        case "Change Mobile Number":
          break;
        case "Change profile type":
          break;
        case "Change profile picture":
          break;
        case "Logout":
          break;
      }

      setItemClicked(null);
      setDropdownState("hiding");
    }
  }, [itemClicked]);

  useEffect(() => {
    switch (dropdownState) {
      case "showing":
        setDropdownState("visible");
        break;
      case "hiding":
        setTimeout(() => setDropdownState("init"), 100);
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
    }
  };

  return (
    <div className="topbar">
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
        <div className={"dropdown " + `dropdown-anim-${dropdownState}`}>
          <div
            className="dropdown-item"
            onClick={() => setItemClicked("View Profile")}
          >
            View Profile
          </div>
          <div
            className="dropdown-item"
            onClick={() => setItemClicked("Change Name")}
          >
            Change Name
          </div>
          <div
            className="dropdown-item"
            onClick={() => setItemClicked("Change Password")}
          >
            Change Password
          </div>
          <div
            className="dropdown-item"
            onClick={() => setItemClicked("Change Mobile Number")}
          >
            Change Mobile Number
          </div>
          <div
            className="dropdown-item"
            onClick={() => setItemClicked("Change profile type")}
          >
            Change profile type
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
          >
            Logout
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{ user: import("../../contexts/auth").User }} props
 */
function HomeForTenant({ user }) {
  return (
    <div className="pages-Home">
      <TopBar>
        <ButtonText rounded="all" title="Rooms" kind="primary" width="50%" />
        <ButtonText
          rounded="all"
          title="Booking"
          kind="cannibalized"
          width="50%"
        />
      </TopBar>
      <div className="content-container">
        <div className="contents">
          <ul className="content-list">
            <li className="content-item"></li>
            <li className="content-item"></li>
            <li className="content-item"></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{ user: import("../../contexts/auth").User }} props
 */
function HomeForOwner({ user }) {
  return (
    <div className="pages-Home">
      <TopBar>
        <ButtonText rounded="all" title="Rooms" kind="primary" width="50%" />
        <ButtonText
          rounded="all"
          title="Booking"
          kind="cannibalized"
          width="50%"
        />
      </TopBar>
      <div className="content-container">
        <div className="contents">
          <ul className="content-list">
            <li className="content-item"></li>
            <li className="content-item"></li>
            <li className="content-item"></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const auth = useAuth();

  return auth.user.type === "TENANT" ? (
    <HomeForTenant user={auth.user} />
  ) : (
    <HomeForOwner user={auth.user} />
  );
}
