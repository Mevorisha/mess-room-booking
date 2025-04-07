import React, { useState } from "react";
import ButtonText from "@/components/ButtonText";
import CustomFab from "@/components/CustomFab";
import NavBars from "@/components/NavBars";
import useDialogBox from "@/hooks/dialogbox";
import { lang } from "@/modules/util/language";
import SectionRoomDrafts from "./SectionRoomDrafts";
import SectionRoomList from "./SectionRoomList";
import SectionBookingList from "./SectionBookingList";
import SectionRoomCreateForm from "@/pages/unparameterized/OwnerRooms/SectionRoomCreateForm";

/**
 * @param {{
 *   page: "rooms"|"bookings",
 *   setPage: React.Dispatch<React.SetStateAction<"rooms" | "bookings">>
 * }} props
 * @returns {React.JSX.Element}
 */
function TabRooms({ page, setPage }) {
  const dialog = useDialogBox();

  function handleAddNewRoom() {
    dialog.show(<SectionRoomCreateForm />, "fullwidth");
  }

  return (
    <div className="pages-Home">
      <NavBars>
        <>
          <ButtonText
            rounded="all"
            title="Rooms"
            kind={page === "rooms" ? "primary" : "cannibalized"}
            width="50%"
            onClick={() => setPage("rooms")}
          />
          <ButtonText
            rounded="all"
            title="Booking"
            kind={page === "bookings" ? "primary" : "cannibalized"}
            width="50%"
            onClick={() => setPage("bookings")}
          />
        </>
      </NavBars>
      <div className="content-container">
        <div className="contents">
          <SectionRoomDrafts handleAddNewRoom={handleAddNewRoom} />
          <SectionRoomList />
          <CustomFab marginBottom={70} title={lang("New Room", "নতুন রুম", "नया रूम")} onClick={handleAddNewRoom} />
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   page: "rooms"|"bookings",
 *   setPage: React.Dispatch<React.SetStateAction<"rooms" | "bookings">>
 * }} props
 * @returns {React.JSX.Element}
 */
function TabBookings({ page, setPage }) {
  return (
    <div className="pages-Home">
      <NavBars>
        <>
          <ButtonText
            rounded="all"
            title="Rooms"
            kind={page === "rooms" ? "primary" : "cannibalized"}
            width="50%"
            onClick={() => setPage("rooms")}
          />
          <ButtonText
            rounded="all"
            title="Booking"
            kind={page === "bookings" ? "primary" : "cannibalized"}
            width="50%"
            onClick={() => setPage("bookings")}
          />
        </>
      </NavBars>
      <SectionBookingList />
    </div>
  );
}

/**
 * @param {{ user: import("@/contexts/user.jsx").User }} props
 * @returns {React.JSX.Element}
 */
export default function SectionHomeForOwner({ user: _ }) {
  const [page, setPage] = useState(/** @type {"rooms"|"bookings"} */ ("rooms"));

  return (
    <>{page === "rooms" ? <TabRooms page={page} setPage={setPage} /> : <TabBookings page={page} setPage={setPage} />}</>
  );
}
