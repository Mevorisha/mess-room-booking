import React, { useCallback, useState } from "react";
import ButtonText from "@/components/ButtonText";
import CustomFab from "@/components/CustomFab";
import NavBars from "@/components/NavBars";
import useDialogBox from "@/hooks/dialogbox";
import { lang } from "@/modules/util/language";
import SectionRoomDrafts from "./SectionRoomDrafts";
import SectionRoomList from "./SectionRoomList";
import SectionBookingList from "./SectionBookingList";
import SectionRoomCreateForm from "@/pages/unparameterized/OwnerRooms/SectionRoomCreateForm";
import { CachePaths } from "@/modules/util/caching";
import { base64FileDataToDataUrl } from "@/modules/util/dataConversion";
import useNotification from "@/hooks/notification";
import { apiGetOrDelete, ApiPaths } from "@/modules/util/api";

/**
 * @typedef {Object} DraftData
 * @property {string} url
 * @property {string} landmark
 * @property {string[]} searchTags
 * @property {string[]} majorTags
 * @property {string} city
 * @property {string} state
 * @property {string} firstImage
 */

/**
 * @returns {React.JSX.Element}
 */
function TabRooms() {
  const dialog = useDialogBox();
  const notify = useNotification();

  const [drafts, setDrafts] = useState(/**@type {DraftData[]}*/ ([]));
  const [rooms, setRooms] = useState(/** @type {import("../../OwnerRooms/SectionRoomUpdateForm").RoomData[]} */ ([]));
  const [roomPages, setRoomPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  const reloadDraft = useCallback(async () => {
    try {
      setIsLoadingDrafts(true);
      const cache = await caches.open(CachePaths.SECTION_ROOM_FORM);
      const cacheKeys = await cache.keys();

      /** @type {{url: string, data: Promise<import("@/pages/unparameterized/OwnerRooms/SectionRoomCreateForm").CachableDraftFormData>}[]} */
      const draftPromises = cacheKeys
        .filter((req) => !req.url.endsWith("/last-id")) // do not take the one that counts last-id
        .map((req) => ({ url: req.url, res: cache.match(req.url) })) // get a response and return both url and response
        .map(({ url, res }) => res && { url, data: res.then((res) => res.json()) }); // for valid reponses, return url and Promise<data> of response

      // await all promises
      const results = await Promise.all(draftPromises.map(async ({ url, data }) => ({ url, data: await data })));

      const loadedDrafts = results.map(({ url, data }) => ({
        url,
        landmark: data.landmark || "",
        searchTags: data.searchTags || [],
        majorTags: data.majorTags || [],
        city: data.city || "",
        state: data.state || "",
        firstImage: data.files?.length > 0 ? base64FileDataToDataUrl(data.files[0]) : "",
      }));

      setDrafts(loadedDrafts.filter(Boolean));
    } catch (error) {
      console.error(error);
      notify(
        lang("Error loading drafts", "ড্রাফট লোড করতে সমস্যা হয়েছে", "ड्राफ्ट लोड करने में त्रुटि हुई है"),
        "error"
      );
    } finally {
      // This timeout reduces flicker by giving user time to adjust to the new UI before popuating it
      setTimeout(() => setIsLoadingDrafts(false), 0);
    }
  }, [notify]);

  const reloadApi = useCallback(
    /**
     * @param {{
     *   page?: number,
     *   invalidateCache?: boolean
     * }} [params]
     */
    async (params) => {
      params = params ?? {};
      params.page = params?.page ?? currentPage;
      setIsLoadingRooms(true);
      const { json } = await apiGetOrDelete(
        "GET",
        ApiPaths.Rooms.readListOnQuery({
          self: true,
          page: params?.page ?? 1,
          invalidateCache: params?.invalidateCache ?? false,
        })
      );
      setRooms(json.rooms);
      setRoomPages(json.totalPages);
      setIsLoadingRooms(false);
    },
    [currentPage]
  );

  function handleAddNewRoom() {
    dialog.show(<SectionRoomCreateForm reloadApi={reloadApi} reloadDraft={reloadDraft} />, "uibox");
  }

  return (
    <div className="pages-Home">
      <div className="content-container">
        <div className="contents">
          <SectionRoomDrafts
            handleAddNewRoom={handleAddNewRoom}
            reloadDraft={reloadDraft}
            reloadApi={reloadApi}
            isLoadingDrafts={isLoadingDrafts}
            isLoadingRooms={isLoadingRooms}
            drafts={drafts}
          />
          <SectionRoomList
            handleAddNewRoom={handleAddNewRoom}
            reloadDraft={reloadDraft}
            reloadApi={reloadApi}
            isLoadingDrafts={isLoadingDrafts}
            isLoadingRooms={isLoadingRooms}
            rooms={rooms}
            roomPages={roomPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
          <CustomFab marginBottom={70} title={lang("New Room", "নতুন রুম", "नया रूम")} onClick={handleAddNewRoom} />
        </div>
      </div>
    </div>
  );
}

/**
 * @returns {React.JSX.Element}
 */
function TabBookings() {
  return (
    <div className="pages-Home">
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
    <>
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
      {page === "rooms" ? <TabRooms /> : <TabBookings />}
    </>
  );
}
