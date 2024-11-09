import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isEmpty } from "../../modules/util/validations.js";
import { ActionParams, PageUrls } from "../../modules/util/pageUrls.js";
import useAuth from "../../hooks/auth.js";
import LoadingPage from "../Loading/index.jsx";
import ButtonText from "../../components/ButtonText";
import TopBar from "../../components/TopBar";

import "./styles.css";

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // user logged in but not onboarded
  // user type is not set
  if (isEmpty(auth.user.type)) {
    searchParams.set("action", ActionParams.SWITCH_PROFILE_TYPE);
    navigate({
      pathname: PageUrls.ONBOARDING,
      search: searchParams.toString(),
    });
    return <LoadingPage />;
  }

  // user mobile number is not set
  if (isEmpty(auth.user.mobile)) {
    searchParams.set("action", ActionParams.CHANGE_MOBILE_NUMBER);
    navigate({
      pathname: PageUrls.ONBOARDING,
      search: searchParams.toString(),
    });
    return <LoadingPage />;
  }

  // home page content
  return auth.user.type === "TENANT" ? (
    <HomeForTenant user={auth.user} />
  ) : (
    <HomeForOwner user={auth.user} />
  );
}
