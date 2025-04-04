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
 * Renders the tenant's home page with navigation buttons and placeholder content.
 *
 * This component displays a navigation bar with "Rooms" and "Booking" buttons along with a content section
 * containing a list of placeholder items. It is designed specifically for tenant users.
 *
 * @param {{ user: import("@/contexts/user.jsx").User }} props - The current tenant's user information.
 * @returns {React.JSX.Element} The rendered tenant home page interface.
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
 * Renders the owner home page with navigation options and room creation capabilities.
 *
 * This component displays a navigation bar with "Rooms" and "Booking" buttons, a placeholder list for content,
 * and a floating action button (FAB) that opens a full-width dialog containing a room creation form.
 *
 * @param {{ user: import("@/contexts/user.jsx").User }} props - Contains the owner user information.
 * @returns {React.JSX.Element} The rendered home page view for an owner.
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
