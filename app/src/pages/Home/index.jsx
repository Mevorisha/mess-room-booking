import React, { useEffect } from "react";
import useAuth from "../../hooks/auth.js";
import ButtonText from "../../components/ButtonText";

// @ts-ignore
import dpMevorisha from "../../assets/images/dpMevorisha.png";
import "./styles.css";

/**
 * @param {{ children }} props
 */
function TopBar({ children }) {
  return (
    <div className="topbar">
      <div className="logo-container">
        <img src={dpMevorisha} alt="logo" />
        <h1>Mevorisha</h1>
      </div>
      <div className="section-buttons-container">{children}</div>
      <div className="action-buttons-container">
        <span>
          <i style={{ fontSize: "1rem" }} className="fa fa-bars"></i>
        </span>
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
