import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { lang } from "@/modules/util/language.js";
import { ActionLabels, ActionType, PagePaths, PageType } from "@/modules/util/pageUrls.js";
import { CachePaths } from "@/modules/util/caching";
import ImageLoader from "@/components/ImageLoader";
import useCompositeUser from "@/hooks/compositeUser.js";
import useNotification from "@/hooks/notification.js";
import { IdentityType } from "sharedtypes";

import "./styles.css";

import dpMevorisha from "@/assets/images/dpMevorisha.png";
import dpGeneric from "@/assets/images/dpGeneric.png";

export interface ActionMenuProps {
  dropdownState: "init" | "showing" | "visible" | "hiding";
  handleDropdownClick: (dropdownState: "init" | "showing" | "visible" | "hiding") => void;
}

function ActionMenu({ dropdownState, handleDropdownClick }: ActionMenuProps): React.ReactNode {
  const compUsr = useCompositeUser();
  // prettier-ignore
  let text = lang("Profile Incomplete!", "প্রোফাইল অসম্পূর্ণ!", "प्रोफ़ाइल अपूर्ण!");

  if (
    compUsr.userCtx.user.get("profilePhotos") == null &&
    (compUsr.userCtx.user.get("firstName") == null || compUsr.userCtx.user.get("lastName") == null)
  )
    // prettier-ignore
    text = lang("Profile Incomplete!", "প্রোফাইল অসম্পূর্ণ!", "प्रोफ़ाइल अपूर्ण!");
  else if (compUsr.userCtx.user.get("profilePhotos") == null)
    // prettier-ignore
    text = lang("Add Profile Photo!", "প্রোফাইল ফটো দিন!", "प्रोफ़ाइल फोटो दें!");
  else if (compUsr.userCtx.user.get("firstName") == null || compUsr.userCtx.user.get("lastName") == null)
    // prettier-ignore
    text = lang("Add Display Name!", "প্রোফাইল নাম দিন!", "प्रोफ़ाइल नाम जोड़ें!");

  if (
    compUsr.userCtx.user.get("profilePhotos") == null ||
    compUsr.userCtx.user.get("firstName") == null ||
    compUsr.userCtx.user.get("lastName") == null
  )
    return (
      <span className="profile-incomplete" onClick={() => handleDropdownClick(dropdownState)}>
        <span>{text}</span>
        {/* <i className="fa fa-exclamation-triangle"></i> */}
        <i className="fa fa-exclamation-circle"></i>
      </span>
    );

  return (
    <span className="profile-complete" onClick={() => handleDropdownClick(dropdownState)}>
      <span className="display-name">
        {compUsr.userCtx.user.get("firstName") ?? ""} {compUsr.userCtx.user.get("lastName") ?? ""}
      </span>
      <ImageLoader
        className="profile-image"
        src={compUsr.userCtx.user.get("profilePhotos")?.small ?? dpGeneric}
        alt="profile"
      />
    </span>
  );
}

function MarkOfIncompletion({ isIncomplete }: { isIncomplete: boolean }): React.ReactNode {
  // returns a red exclamation mark if isIncomplete true
  if (!isIncomplete) return <></>;
  return (
    <span className="profile-incomplete">
      <i style={{ marginTop: "1px", fontSize: "1.1rem" }} className="fa fa-exclamation-circle"></i>
    </span>
  );
}

export default function TopBar({ children }: { children: React.ReactNode }): React.ReactNode {
  const compUsr = useCompositeUser();
  const navigate = useNavigate();
  const notify = useNotification();

  const [dropdownState, setDropdownState] = useState<"init" | "showing" | "visible" | "hiding">("init");

  const [searchParams] = useSearchParams();

  function handleItemClick(itemClicked: ActionType) {
    searchParams.set("action", itemClicked);

    /* redirect or take action based on the item clicked */
    switch (itemClicked) {
      // view profile action
      case ActionType.VIEW_PROFILE:
        navigate({
          pathname: PagePaths[PageType.PROFILE],
          search: searchParams.toString(),
        });
        break;
      // onboarding actions
      case ActionType.CHANGE_NAME:
      case ActionType.CHANGE_MOBILE_NUMBER:
      case ActionType.CHANGE_LANGUAGE:
      case ActionType.SWITCH_PROFILE_TYPE:
      case ActionType.UPDATE_PROFILE_PHOTO:
      case ActionType.UPDATE_ID_DOCS:
        navigate({
          pathname: PagePaths[PageType.ONBOARDING],
          search: searchParams.toString(),
        });
        break;
      // reset password action
      case ActionType.RESET_PASSWORD:
        compUsr.accountCtx.requestPasswordReset().catch((e: Error) => notify(e, "error"));
        searchParams.delete("action");
        break;
      // log out action
      case ActionType.LOGOUT:
        // prettier-ignore
        compUsr.authCtx
          .logOut()
          .then(() => caches.delete(CachePaths.FILE_LOADER))
          .then(() => caches.delete(CachePaths.SECTION_ROOM_FORM))
          .then((status) => status && notify(lang("Image cache cleared", "ইমেজ ক্যাশ সাফ করা হয়েছে", "इमेज कैश साफ किया गया है"), "warning"))
          .catch((e: Error) => notify(e, "error"));
        searchParams.delete("action");
        break;
      // invalid action
      default:
        notify(lang("Action not recognized", "অবৈধ ক্রিয়া!", "अवैध कार्य"), "error");
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
      case "init":
      case "visible":
      default:
        break;
    }
  }, [dropdownState]);

  function handleDropdownClick(dropdownState: "init" | "showing" | "visible" | "hiding") {
    switch (dropdownState) {
      case "init":
        setDropdownState("showing");
        break;
      case "visible":
        setDropdownState("hiding");
        break;
      case "showing":
      case "hiding":
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
        <ActionMenu dropdownState={dropdownState} handleDropdownClick={handleDropdownClick} />

        <div className={`dropdown dropdown-anim-${dropdownState}`}>
          {/* View Profile */}
          <div className="dropdown-item" onClick={() => handleItemClick(ActionType.VIEW_PROFILE)}>
            {
              /* prettier-ignore */ compUsr.userCtx.user.get("type") === IdentityType.OWNER
              ? lang("View Owner Profile", "মালিকের প্রোফাইল দেখুন", "मालिक प्रोफ़ाइल देखें")
              : lang("View Tenant Profile", "ভাড়াটের প্রোফাইল দেখুন", "किरायेदार प्रोफ़ाइल देखें")
            }
          </div>
          {/* Switch Profile Type */}
          <div className="dropdown-item" onClick={() => handleItemClick(ActionType.SWITCH_PROFILE_TYPE)}>
            {
              /* prettier-ignore */ compUsr.userCtx.user.get("type") === IdentityType.OWNER
              ? lang("Switch to Tenant Profile", "ভাড়াটের প্রোফাইলে স্যুইচ করুন", "किरायेदार पर स्विच करें")
              : lang("Switch to Owner Profile", "মালিকের প্রোফাইলে স্যুইচ করুন", "मालिक पर स्विच करें")
            }
          </div>
          {/* Update Profile Photo */}
          <div className="dropdown-item" onClick={() => handleItemClick(ActionType.UPDATE_PROFILE_PHOTO)}>
            {lang(
              ActionLabels[ActionType.UPDATE_PROFILE_PHOTO].en,
              ActionLabels[ActionType.UPDATE_PROFILE_PHOTO].bn,
              ActionLabels[ActionType.UPDATE_PROFILE_PHOTO].hi
            )}
            <MarkOfIncompletion isIncomplete={compUsr.userCtx.user.get("profilePhotos") == null} />
          </div>
          {/* Update ID Documents */}
          <div className="dropdown-item" onClick={() => handleItemClick(ActionType.UPDATE_ID_DOCS)}>
            {lang(
              ActionLabels[ActionType.UPDATE_ID_DOCS].en,
              ActionLabels[ActionType.UPDATE_ID_DOCS].bn,
              ActionLabels[ActionType.UPDATE_ID_DOCS].hi
            )}
          </div>
          {/* Change Name */}
          <div className="dropdown-item" onClick={() => handleItemClick(ActionType.CHANGE_NAME)}>
            {lang(
              ActionLabels[ActionType.CHANGE_NAME].en,
              ActionLabels[ActionType.CHANGE_NAME].bn,
              ActionLabels[ActionType.CHANGE_NAME].hi
            )}
            <MarkOfIncompletion
              isIncomplete={
                compUsr.userCtx.user.get("firstName") == null || compUsr.userCtx.user.get("lastName") == null
              }
            />
          </div>
          {/* Change Mobile Number */}
          <div className="dropdown-item" onClick={() => handleItemClick(ActionType.CHANGE_MOBILE_NUMBER)}>
            {lang(
              ActionLabels[ActionType.CHANGE_MOBILE_NUMBER].en,
              ActionLabels[ActionType.CHANGE_MOBILE_NUMBER].bn,
              ActionLabels[ActionType.CHANGE_MOBILE_NUMBER].hi
            )}
          </div>
          {/* Request Password Reset */}
          <div className="dropdown-item" onClick={() => handleItemClick(ActionType.RESET_PASSWORD)}>
            {lang(
              ActionLabels[ActionType.RESET_PASSWORD].en,
              ActionLabels[ActionType.RESET_PASSWORD].bn,
              ActionLabels[ActionType.RESET_PASSWORD].hi
            )}
          </div>
          {/* Change Language */}
          <div className="dropdown-item" onClick={() => handleItemClick(ActionType.CHANGE_LANGUAGE)}>
            {lang(
              ActionLabels[ActionType.CHANGE_LANGUAGE].en,
              ActionLabels[ActionType.CHANGE_LANGUAGE].bn,
              ActionLabels[ActionType.CHANGE_LANGUAGE].hi
            )}
          </div>
          {/* Log Out */}
          <div style={{ color: "red" }} className="dropdown-item" onClick={() => handleItemClick(ActionType.LOGOUT)}>
            {lang(
              ActionLabels[ActionType.LOGOUT].en,
              ActionLabels[ActionType.LOGOUT].bn,
              ActionLabels[ActionType.LOGOUT].hi
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
