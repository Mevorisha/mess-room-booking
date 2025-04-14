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
import User from "@/modules/classes/User";
import type { CachableDraftFormData } from "@/pages/unparameterized/OwnerRooms/SectionRoomCreateForm";
import type { Base64FileData } from "../../OwnerRooms/SectionRoomUpdateForm";
import type { RoomData } from "@/modules/networkTypes/Room";

export interface DraftData {
  url: string;
  landmark: string;
  searchTags: string[];
  majorTags: string[];
  city: string;
  state: string;
  firstImage: string;
}

export interface ReloadApiParams {
  page?: number;
  invalidateCache?: boolean;
}

function TabRooms(): React.ReactNode {
  const dialog = useDialogBox();
  const notify = useNotification();

  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [roomPages, setRoomPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [isLoadingDrafts, setIsLoadingDrafts] = useState<boolean>(true);
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(true);

  const reloadDraft = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingDrafts(true);
      const cache = await caches.open(CachePaths.SECTION_ROOM_FORM);
      const cacheKeys = await cache.keys();

      interface DraftPromise {
        url: string;
        data: Promise<CachableDraftFormData>;
      }

      const draftPromises: DraftPromise[] = cacheKeys
        .filter((req) => !req.url.endsWith("/last-id")) // do not take the one that counts last-id
        .map((req) => ({ url: req.url, res: cache.match(req.url) })) // get a response and return both url and response
        .map(({ url, res }) => ({ url, data: res.then((res) => res?.json()) })) // for valid responses, return url and Promise<data> of response
        .filter(Boolean) as DraftPromise[]; // Filter out nulls

      // await all promises
      const results = await Promise.all(draftPromises.map(async ({ url, data }) => ({ url, data: await data })));

      const loadedDrafts = results.map(({ url, data }) => ({
        url,
        landmark: data.landmark,
        searchTags: data.searchTags,
        majorTags: data.majorTags,
        city: data.city,
        state: data.state,
        firstImage: data.files.length > 0 ? base64FileDataToDataUrl(data.files[0] as Base64FileData) : "",
      }));

      setDrafts(loadedDrafts);
    } catch (error) {
      console.error(error);
      notify(
        lang("Error loading drafts", "ড্রাফট লোড করতে সমস্যা হয়েছে", "ड्राफ्ट लोड करने में त्रुटि हुई है"),
        "error"
      );
    } finally {
      // This timeout reduces flicker by giving user time to adjust to the new UI before populating it
      setTimeout(() => setIsLoadingDrafts(false), 0);
    }
  }, [notify]);

  const reloadApi = useCallback(
    async (params?: ReloadApiParams): Promise<void> => {
      const page = params?.page ?? currentPage;
      setIsLoadingRooms(true);
      const { json } = await apiGetOrDelete(
        "GET",
        ApiPaths.Rooms.readListOnQuery({ self: true, page: page, invalidateCache: params?.invalidateCache ?? false })
      ).then(({ json }) => ({ json } as { json: { rooms: RoomData[]; totalPages: number } }));
      setRooms(json.rooms);
      setRoomPages(json.totalPages);
      setIsLoadingRooms(false);
    },
    [currentPage]
  );

  function handleAddNewRoom(): void {
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

function TabBookings(): React.ReactNode {
  return (
    <div className="pages-Home">
      <SectionBookingList />
    </div>
  );
}

interface SectionHomeForOwnerProps {
  user: User;
}

export default function SectionHomeForOwner({ user: _ }: SectionHomeForOwnerProps): React.ReactNode {
  const [page, setPage] = useState<"rooms" | "bookings">("rooms");

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
