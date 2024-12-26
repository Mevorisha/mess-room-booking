import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isEmpty } from "../../modules/util/validations.js";
import { ActionParams, PageUrls } from "../../modules/util/pageUrls.js";
import useUsrCompositeCtx from "../../hooks/compositeUser.js";
import LoadingPage from "../Loading/index.jsx";
import ButtonText from "../../components/ButtonText";
import TopBar from "../../components/TopBar";

import "./styles.css";

/**
 * @param {{ user: import("../../contexts/user").User }} props
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
 * @param {{ user: import("../../contexts/user").User }} props
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
  const compUsrCtx = useUsrCompositeCtx();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // user logged in but profile type not set
    if (isEmpty(compUsrCtx.userCtx.user.type)) {
      searchParams.set("action", ActionParams.SWITCH_PROFILE_TYPE);
      navigate({
        pathname: PageUrls.ONBOARDING,
        search: searchParams.toString(),
      });
    }

    // user logged in but mobile number not set
    else if (isEmpty(compUsrCtx.userCtx.user.mobile)) {
      searchParams.set("action", ActionParams.CHANGE_MOBILE_NUMBER);
      navigate({
        pathname: PageUrls.ONBOARDING,
        search: searchParams.toString(),
      });
    }
  }, [
    compUsrCtx.userCtx.user.type,
    compUsrCtx.userCtx.user.mobile,
    searchParams,
    navigate,
  ]);

  // user logged in but not onboarded
  if (
    isEmpty(compUsrCtx.userCtx.user.type) ||
    isEmpty(compUsrCtx.userCtx.user.mobile)
  ) {
    return <LoadingPage />;
  }

  // home page content
  return compUsrCtx.userCtx.user.type === "TENANT" ? (
    <HomeForTenant user={compUsrCtx.userCtx.user} />
  ) : (
    <HomeForOwner user={compUsrCtx.userCtx.user} />
  );
}
