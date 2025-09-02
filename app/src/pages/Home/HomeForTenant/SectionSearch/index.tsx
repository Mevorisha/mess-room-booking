import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGetOrDelete, ApiPaths } from "@/modules/util/api";
import { lang } from "@/modules/util/language";
import useNotification from "@/hooks/notification";
import useCompositeUser from "@/hooks/compositeUser";
import PagingContainer from "@/components/PagingContainer";
import ImageLoader from "@/components/ImageLoader";
import LoadingAnimation from "@/components/LoadingAnimation";
import ButtonText from "@/components/ButtonText";
import useDialog from "@/hooks/dialogbox";
import FilterSearch from "@/components/FilterSearch";
import SectionRoomView from "@/pages/Home/sections/RoomView";
import {
  HttpMethodTypes,
  PaginationDTO,
  QuerySortOrder,
  RoomGetReqQueryParamsWrapper,
  RoomGetResBodyNotOwnerDTO,
  UNKNOWN_STR,
} from "sharedtypes";

import "./styles.css";

export default function SectionSearch(): React.ReactNode {
  const notify = useNotification();
  const dialog = useDialog();
  const compUsr = useCompositeUser();

  // WARNING: setSearchParams should be called only in 2 places
  // once in the effect
  // once in the handler that opens room view dialog to add the roomId to the seach params
  // This is cause searchParams are a reflection of the query, and NOT the other way around
  // Query while is loaded from the URL, this is for initializing the state ONLY
  // After this, all updates are done via setQuery and setSearchParams is called only once
  // to update the URL in a useEffect as a side effect of the query change
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();

  // State for rooms data
  const [rooms, setRooms] = useState<RoomGetResBodyNotOwnerDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResuts, setTotalResuts] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // State for search query
  const [roomQueryWrapper, setRoomQueryWrapper] = useState<RoomGetReqQueryParamsWrapper>(() => {
    const newUrlSearchParams = new URLSearchParams(urlSearchParams);
    newUrlSearchParams.delete("roomId");
    const newRoomQueryWrapperResult = RoomGetReqQueryParamsWrapper.create(newUrlSearchParams);
    if (newRoomQueryWrapperResult.isErr) {
      // Handle error so that it is not thrown inside react
      notify(newRoomQueryWrapperResult.error, "error");
      // Unwrap or throw here: NOTE: It's logically impossible for create to throw here
      return RoomGetReqQueryParamsWrapper.create().unwrapOrThrow();
    }
    newRoomQueryWrapperResult.value.delete("roomId");
    return newRoomQueryWrapperResult.value;
  });

  const apiUri = ApiPaths.Rooms.readListOnQuery(roomQueryWrapper);

  // State for search input
  const [searchStringInput, setSearchStringInput] = useState<string>(roomQueryWrapper.searchTags?.join(" ").trim() ?? ""); // prettier-ignore

  // Is room view dialog visible or not
  const [isRoomViewVisible, setIsRoomViewVisible] = useState<boolean>(false);

  // State to track if filters are applied
  const [hasFilters, _setHasFilters] = useState<boolean>(false);
  const updateHasFilters = useCallback(
    (value?: boolean) => {
      if (value != null) {
        _setHasFilters(value);
        return;
      }
      const apiParams = new URL(apiUri).searchParams;
      _setHasFilters(
        apiParams.has("acceptGender") ||
          apiParams.has("acceptOccupation") ||
          apiParams.has("capacity") ||
          apiParams.has("lowPrice") ||
          apiParams.has("highPrice") ||
          apiParams.has("sortOn") ||
          (apiParams.has("sortOrder") && apiParams.get("sortOrder") === QuerySortOrder.DESCENDING)
      );
    },
    [apiUri, _setHasFilters]
  );

  // Check if we're on mobile view
  const [isMobileView, setIsMobileView] = useState<boolean>(window.innerWidth < 750);

  // Function to handle search
  const handleSearch = useCallback(
    (): void =>
      void setRoomQueryWrapper((oldWrapper) => {
        const trimmedSearchStr = searchStringInput.trim();
        const trimmedSearchStrLength = trimmedSearchStr.length;
        const newWrapperResult = oldWrapper.clone();
        if (newWrapperResult.isErr) {
          // Handle error so that it is not thrown inside react
          notify(newWrapperResult.error, "error");
          return oldWrapper;
        }
        if (trimmedSearchStrLength > 0) {
          // Set searchTags in query and reset page to 1
          // also remove invalidateCache param if present
          newWrapperResult.value.set("searchTags", trimmedSearchStr.split(" "));
          newWrapperResult.value.set("page", 1);
        } else {
          // Remove searchTags from query and remove page
          newWrapperResult.value.delete("searchTags");
          // reset page and invalidateCache
          newWrapperResult.value.set("page", 1);
          newWrapperResult.value.set("invalidateCache", true);
        }
        return newWrapperResult.value;
      }),
    // Update has filters
    [notify, searchStringInput, setRoomQueryWrapper]
  );

  // Function to handle filter changes
  const handleQueryChange = useCallback(
    (newQueryWrapper: RoomGetReqQueryParamsWrapper) => {
      setRoomQueryWrapper((oldQueryWrapper) => {
        const newQueryWrapperResult = newQueryWrapper.clone();
        if (newQueryWrapperResult.isErr) {
          // Handle error so that it is not thrown inside react
          notify(newQueryWrapperResult.error, "error");
          return oldQueryWrapper;
        }
        newQueryWrapper = newQueryWrapperResult.value;
        // Set respective filters in query and reset page to 1
        newQueryWrapper.set("page", 1);
        const oldSearchTags = oldQueryWrapper.get("searchTags");
        if (oldSearchTags != null) {
          newQueryWrapper.set("searchTags", oldSearchTags);
        }
        return newQueryWrapper;
      });
      updateHasFilters();
    },
    [notify, updateHasFilters, setRoomQueryWrapper]
  );

  // Function to handle clearing filters
  const handleQueryClear = useCallback(() => {
    // Clear all filters in query but keep searchTags
    setRoomQueryWrapper((oldQueryWrapper) => {
      const newQueryWrapperResult = RoomGetReqQueryParamsWrapper.create();
      if (newQueryWrapperResult.isErr) {
        // Handle error so that it is not thrown inside react
        notify(newQueryWrapperResult.error, "error");
        return oldQueryWrapper;
      }
      const newQueryWrapper = newQueryWrapperResult.value;
      const oldSearchTags = oldQueryWrapper.get("searchTags");
      if (oldSearchTags != null) {
        newQueryWrapper.set("searchTags", oldSearchTags);
      }
      return newQueryWrapper;
    });
    updateHasFilters();
  }, [updateHasFilters, notify, setRoomQueryWrapper]);

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      setRoomQueryWrapper((oldQueryWrapper) => {
        const newWrapperResult = oldQueryWrapper.clone();
        if (newWrapperResult.isErr) {
          // Handle error so that it is not thrown inside react
          notify(newWrapperResult.error, "error");
          return oldQueryWrapper;
        }
        newWrapperResult.value.set("page", page);
        newWrapperResult.value.set("invalidateCache", false);
        return newWrapperResult.value;
      });
    },
    [setCurrentPage, notify, setRoomQueryWrapper]
  );

  // Function to open filters dialog on mobile
  const handleOpenFiltersDialog = useCallback(() => {
    dialog.show(
      <FilterSearch
        currentRoomQuery={roomQueryWrapper}
        handleQueryChange={handleQueryChange}
        handleQueryClear={handleQueryClear}
        isDialog={true}
      />,
      "small"
    );
  }, [dialog, roomQueryWrapper, handleQueryChange, handleQueryClear]);

  // Function to load rooms data
  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiGetOrDelete(HttpMethodTypes.GET, apiUri);
      if (response.json == null) return;
      // Throw error so that it is handled in the promise chain rather than resolving here as success
      const paginationDTO = PaginationDTO.fromJsonWithGeneric<RoomGetResBodyNotOwnerDTO>(response.json, RoomGetResBodyNotOwnerDTO).unwrapOrThrow(); // prettier-ignore
      const page = paginationDTO;
      setRooms(page.items);
      setTotalPages(page.totalPages);
      setTotalResuts(page.totalItems);
    } catch (error) {
      notify(error as Error, "error");
    } finally {
      setIsLoading(false);
    }
  }, [apiUri, notify]);

  const handleViewRoom = useCallback(
    (roomId: string) => {
      // return if already visible
      if (isRoomViewVisible) return;
      // else make it visible
      setIsRoomViewVisible(true);

      const userId = compUsr.userCtx.user.uid;
      // add roomId param if not already added to the url query params
      if (!urlSearchParams.has("roomId") || urlSearchParams.get("roomId") == null) {
        const newUrlSearchParams = new URLSearchParams(urlSearchParams);
        newUrlSearchParams.set("roomId", roomId);
        setUrlSearchParams(newUrlSearchParams);
      }

      const roomViewDialogId = dialog.show(<LoadingAnimation />, "large");

      // call api
      apiGetOrDelete(HttpMethodTypes.GET, ApiPaths.Rooms.read(roomId), RoomGetResBodyNotOwnerDTO)
        .then(({ dto }) => {
          dialog.setContent(
            roomViewDialogId,
            <SectionRoomView
              roomData={dto}
              showBookingButton={userId !== dto.ownerId}
              setIsRoomViewVisible={setIsRoomViewVisible}
            />,
            "uibox"
          );
        })
        .catch((error: Error) => notify(error, "error"));
    },
    [isRoomViewVisible, compUsr.userCtx.user.uid, urlSearchParams, dialog, setUrlSearchParams, notify]
  );

  // Effect to handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 750);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load rooms when query changes
  useEffect(() => void loadRooms().catch((e: Error) => notify(e, "error")), [loadRooms, notify, roomQueryWrapper]);

  // Update page number when query changes
  useEffect(() => setCurrentPage(roomQueryWrapper.page), [roomQueryWrapper]);

  // Show a room if roomId is present
  useEffect(
    () =>
      void (
        urlSearchParams.has("roomId") &&
        urlSearchParams.get("roomId") != null &&
        handleViewRoom(urlSearchParams.get("roomId") ?? "")
      ),
    [handleViewRoom, urlSearchParams]
  );

  // Effect to update the query params in the URL bar
  useEffect(() => {
    // copy current search params
    const newRoomQueryWrapperResult = roomQueryWrapper.clone();
    if (newRoomQueryWrapperResult.isErr) {
      // Handle error so that it is not thrown inside react
      notify(newRoomQueryWrapperResult.error, "error");
      return;
    }
    // has to add extra line coz roomQueryWrapper ignores roomId in urlSearchParams
    if (urlSearchParams.has("roomId")) {
      newRoomQueryWrapperResult.value.set("roomId", urlSearchParams.get("roomId") ?? UNKNOWN_STR);
    }
    // update params from API URI
    const apiParams = new URL(apiUri).searchParams;
    // idk why filters were updated so early
    updateHasFilters();
    // remove params not in new API URI
    for (const [key] of newRoomQueryWrapperResult.value.entries()) {
      // seperately check for presence of roomId param
      if (key === "roomId") continue;
      // remove otherwise
      if (!apiParams.has(key)) newRoomQueryWrapperResult.value.delete(key);
    }
    // add params from API URI
    for (const [key, value] of apiParams.entries()) {
      // @ts-expect-error Key probably is valid
      if (value !== "") newRoomQueryWrapperResult.value.set(key, value);
    }
    // set as new search params of page
    // this will reflect in the url
    setUrlSearchParams(newRoomQueryWrapperResult.value.toQueryParams());
  }, [roomQueryWrapper, apiUri, setUrlSearchParams, updateHasFilters, urlSearchParams, notify]);

  return (
    <div className="section-Search">
      <div className="search-header">
        <div className="input-span">
          <input
            type="text"
            className="search-input"
            placeholder={lang(
              "Search by landmark, area, etc.",
              "ল্যান্ডমার্ক, এলাকা ইত্যাদি দ্বারা অনুসন্ধান করুন",
              "लैंडमार्क, क्षेत्र आदि से खोजें"
            )}
            value={searchStringInput}
            onChange={(e) => setSearchStringInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="search-button" onClick={handleSearch}>
            <i className="fa fa-search" aria-hidden="true"></i>
          </button>
          {isMobileView && (
            <button className={`filter-button ${hasFilters ? "filter-active" : ""}`} onClick={handleOpenFiltersDialog}>
              <i className="fa fa-filter" aria-hidden="true"></i>
            </button>
          )}
        </div>
      </div>
      <div className="search-content">
        {!isMobileView && (
          <div className="filters-sidebar">
            <FilterSearch
              currentRoomQuery={roomQueryWrapper}
              handleQueryChange={handleQueryChange}
              handleQueryClear={handleQueryClear}
            />
          </div>
        )}

        <div className="results-container">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          ) : rooms.length > 0 ? (
            <>
              <div className="results-header">
                <h2>
                  {lang(
                    `${totalResuts} Room${rooms.length !== 1 ? "s" : ""} Found`,
                    `${totalResuts}টি রুম পাওয়া গেছে`,
                    `${totalResuts} रूम मिले`
                  )}
                </h2>
              </div>

              <ul className="content-list">
                {rooms.map((room, index) => (
                  <li key={index} className="content-item">
                    <div className="item-preview">
                      {room.images.length > 0 && (
                        <div className="item-image">
                          <ImageLoader src={room.images[0]?.large ?? ""} alt={room.landmark} />
                        </div>
                      )}
                      <div className="item-preview-nonimg">
                        <div className="item-info">
                          <div className="item-landmark" title={room.landmark}>
                            {room.landmark}
                          </div>
                          <div className="item-location">
                            {room.city}, {room.state}
                          </div>
                          <div className="item-tags">
                            {room.majorTags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} title={tag} className="tag search-tag">
                                {tag}
                              </span>
                            ))}
                            {room.minorTags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} title={tag} className="tag major-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="item-price">
                            <span className="price-amount">₹{room.pricePerOccupant}</span>
                            <span className="price-period">{" " + lang("per head", "প্রতি জনে", "प्रति व्यक्ति")}</span>
                          </div>
                        </div>
                        <div className="item-actions">
                          <div className="item-rating" title={room.rating.toString()}>
                            <i className="fa fa-star-o"></i>
                            <span>{room.rating}</span>
                          </div>

                          <ButtonText
                            rounded="all"
                            kind="secondary"
                            onClick={() => handleViewRoom(room.id)}
                            title={lang("View", "দেখুন", "देखें")}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <PagingContainer
                totalPages={totalPages}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <div className="no-results-message">
              <p>
                {lang(
                  "No rooms found matching your criteria",
                  "আপনার মানদণ্ড অনুযায়ী কোন রুম পাওয়া যায়নি",
                  "आपके मापदंड के अनुसार कोई रूम नहीं मिला"
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
