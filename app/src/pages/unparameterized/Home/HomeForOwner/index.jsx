import React from "react";
import ButtonText from "@/components/ButtonText";
import CustomFab from "@/components/CustomFab";
import NavBars from "@/components/NavBars";
import useDialogBox from "@/hooks/dialogbox";
import { lang } from "@/modules/util/language";
import SectionRoomDrafts from "./SectionRoomDrafts";
import SectionRoomList from "./SectionRoomList";
import SectionRoomCreateForm from "@/pages/unparameterized/OwnerRooms/SectionRoomCreateForm";

/**
 * @param {{ user: import("@/contexts/user.jsx").User }} props
 * @returns {React.JSX.Element}
 */
export default function SectionHomeForOwner({ user: _ }) {
  const dialog = useDialogBox();

  function handleAddNewRoom() {
    dialog.show(<SectionRoomCreateForm />, "fullwidth");
  }

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
          <SectionRoomDrafts handleAddNewRoom={handleAddNewRoom} />
          <SectionRoomList />
        </div>
      </div>
      <CustomFab marginBottom={70} title={lang("New Room", "নতুন রুম", "नया रूम")} onClick={handleAddNewRoom} />
    </div>
  );
}
