import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { isEmpty } from "@/modules/util/validations.js";
import { ActionParams, PageUrls } from "@/modules/util/pageUrls.js";
import { lang } from "@/modules/util/language.js";

import useCompositeUser from "@/hooks/compositeUser.js";
import useDialog from "@/hooks/dialogbox.js";

import ButtonText from "@/components/ButtonText";
import CustomFab from "@/components/CustomFab";
import NavBars from "@/components/NavBars";
import LoadingPage from "@/pages/unparameterized/Loading";
import SectionRoomCreateForm from "@/pages/unparameterized/OwnerRooms/SectionRoomCreateForm/index.jsx";

import "./styles.css";

/**
 * @param {{ user: import("@/contexts/user.jsx").User }} props
 * @returns {React.JSX.Element}
 */
function HomeForTenant({ user }) {
  return (
    <div className="pages-Home">
      <NavBars>
        <>
          <ButtonText rounded="all" title="Rooms" kind="primary" width="50%" />
          <ButtonText rounded="all" title="Booking" kind="cannibalized" width="50%" />
        </>
      </NavBars>
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
 * @param {{ user: import("@/contexts/user.jsx").User }} props
 * @returns {React.JSX.Element}
 */
function HomeForOwner({ user }) {
  const dialog = useDialog();
  return (
    <div className="pages-Home">
      <NavBars>
        <>
          <ButtonText rounded="all" title="Rooms" kind="primary" width="50%" />
          <ButtonText rounded="all" title="Booking" kind="cannibalized" width="50%" />
        </>
      </NavBars>
      <div className="content-container">
        <div className="contents">
          <ul className="content-list">
            <li className="content-item"></li>
            <li className="content-item"></li>
            <li className="content-item"></li>
          </ul>
        </div>
      </div>
      <CustomFab
        marginBottom={70}
        title={lang("New Room", "নতুন রুম", "नया रूम")}
        onClick={() => dialog.show(<SectionRoomCreateForm />, "fullwidth")}
      />
    </div>
  );
}

/**
 * @returns {React.JSX.Element}
 */
export default function Home() {
  const compUsr = useCompositeUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // user logged in but profile type not set
    if (isEmpty(compUsr.userCtx.user.type)) {
      searchParams.set("action", ActionParams.SWITCH_PROFILE_TYPE);
      navigate({
        pathname: PageUrls.ONBOARDING,
        search: searchParams.toString(),
      });
    }

    // user logged in but mobile number not set
    else if (isEmpty(compUsr.userCtx.user.mobile)) {
      searchParams.set("action", ActionParams.CHANGE_MOBILE_NUMBER);
      navigate({
        pathname: PageUrls.ONBOARDING,
        search: searchParams.toString(),
      });
    }

    // user logged in but no language set
    else if (isEmpty(window.localStorage.getItem("lang"))) {
      searchParams.set("action", ActionParams.CHANGE_LANGUAGE);
      navigate({
        pathname: PageUrls.ONBOARDING,
        search: searchParams.toString(),
      });
    }
  }, [compUsr.userCtx.user.type, compUsr.userCtx.user.mobile, searchParams, navigate]);

  // user logged in but not onboarded
  if (
    isEmpty(compUsr.userCtx.user.type) ||
    isEmpty(compUsr.userCtx.user.mobile) ||
    isEmpty(window.localStorage.getItem("lang"))
  ) {
    return <LoadingPage />;
  }

  // home page content
  return compUsr.userCtx.user.type === "TENANT" ? (
    <HomeForTenant user={compUsr.userCtx.user} />
  ) : (
    <HomeForOwner user={compUsr.userCtx.user} />
  );
}
