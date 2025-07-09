import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGetOrDelete, ApiPaths } from "@/modules/util/api";
import { RoomData, RoomQueryParser } from "@/modules/networkTypes/Room";
import { lang } from "@/modules/util/language";
import useNotification from "@/hooks/notification";
import useCompositeUser from "@/hooks/compositeUser";
import PagingContainer from "@/components/PagingContainer";
import ImageLoader from "@/components/ImageLoader";
import ButtonText from "@/components/ButtonText";
import useDialogBox from "@/hooks/dialogbox";
import FilterSearch from "@/components/FilterSearch";
import { RoomQuery } from "@/modules/networkTypes/Room";
import SectionRoomView from "@/pages/unparameterized/RoomViews/SectionRoomView";

import "./styles.css";

export default function SectionSearch(): React.ReactNode {
  const notify = useNotification();
  const dialog = useDialogBox();
  const compUsr = useCompositeUser();

  // WARNING: setSearchParams should be called only in 2 places
  // once in the effect
  // once in the handler that opens room view dialog to add the roomId to the seach params
  // This is cause searchParams are a reflection of the query, and NOT the other way around
  // Query while is loaded from the URL, this is for initializing the state ONLY
  // After this, all updates are done via setQuery and setSearchParams is called only once
  // to update the URL in a useEffect as a side effect of the query change
  const [urlQueryParams, setUrlQueryParams] = useSearchParams();

  // State for rooms data
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResuts, setTotalResuts] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // State for search query
  const [searchQuery, setSearchQuery] = useState<RoomQuery>(RoomQueryParser.from(urlQueryParams));
  const apiUri = ApiPaths.Rooms.readListOnQuery(searchQuery);

  // State for search input
  const [searchInput, setSearchInput] = useState<string>(searchQuery.searchTags?.join(" ") ?? "");

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
          apiParams.has("sortOrder")
      );
    },
    [apiUri, _setHasFilters]
  );

  // Check if we're on mobile view
  const [isMobileView, setIsMobileView] = useState<boolean>(window.innerWidth < 750);

  // Function to handle search
  const handleSearch = useCallback(() => {
    const searchStr = searchInput.trim();
    const searchStrLength = searchStr.length;
    if (searchStrLength > 0) {
      // Set searchTags in query and reset page to 1
      setSearchQuery((oldQuery) => ({ ...oldQuery, searchTags: searchStr.split(" "), page: 1 }));
    } else {
      // Remove searchTags from query and remove page
      setSearchQuery((oldQuery) => {
        delete oldQuery.searchTags;
        delete oldQuery.page;
        return { ...oldQuery };
      });
    }
  }, [searchInput, setSearchQuery]);

  // Function to handle filter changes
  const handleFilterChange = useCallback(
    (newFilters: Partial<RoomQuery>) => {
      // Set respective filters in query and reset page to 1
      setSearchQuery(() => ({ ...newFilters, page: 1 }));
      updateHasFilters();
    },
    [updateHasFilters, setSearchQuery]
  );

  // Function to handle clearing filters
  const handleFilterClear = useCallback(() => {
    // Clear all filters in query but keep searchTags
    setSearchQuery((oldQuery) => {
      if (oldQuery.searchTags == null) return {};
      return { searchTags: oldQuery.searchTags };
    });
    updateHasFilters();
  }, [updateHasFilters, setSearchQuery]);

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      setSearchQuery((oldQuery) => ({ ...oldQuery, page }));
    },
    [setCurrentPage, setSearchQuery]
  );

  // Function to open filters dialog on mobile
  const handleOpenFiltersDialog = useCallback(() => {
    dialog.show(
      <FilterSearch
        currentFilters={searchQuery}
        handleFilterChange={handleFilterChange}
        handleFilterClear={handleFilterClear}
        isDialog={true}
      />,
      "small"
    );
  }, [dialog, searchQuery, handleFilterChange, handleFilterClear]);

  // Function to load rooms data
  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiGetOrDelete("GET", apiUri);
      if (response.json != null) {
        const data = response.json as { rooms: RoomData[]; totalPages: number; totalItems: number };
        setRooms(data.rooms);
        setTotalPages(data.totalPages);
        setTotalResuts(data.totalItems);
      }
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
      if (!urlQueryParams.has("roomId") || urlQueryParams.get("roomId") == null) {
        const newParams = new URLSearchParams(urlQueryParams);
        newParams.set("roomId", roomId);
        setUrlQueryParams(newParams);
      }

      // call api
      apiGetOrDelete("GET", ApiPaths.Rooms.read(roomId))
        .then(({ json }) => json as RoomData)
        .then((roomData) =>
          dialog.show(
            <SectionRoomView
              roomData={roomData}
              showBookingButton={userId !== roomData.ownerId}
              setIsRoomViewVisible={setIsRoomViewVisible}
            />,
            "uibox"
          )
        )
        .catch((error: Error) => notify(error, "error"));
    },
    [dialog, notify, compUsr, urlQueryParams, setUrlQueryParams, isRoomViewVisible, setIsRoomViewVisible]
  );

  // Effect to handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 750);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load rooms when query changes
  useEffect(() => void loadRooms().catch((e: Error) => notify(e, "error")), [loadRooms, notify, searchQuery]);

  // Show a room if roomId is present
  useEffect(
    () =>
      void (
        urlQueryParams.has("roomId") &&
        urlQueryParams.get("roomId") != null &&
        handleViewRoom(urlQueryParams.get("roomId") ?? "")
      ),
    [handleViewRoom, urlQueryParams]
  );

  // Effect to update the query params in the URL bar
  useEffect(() => {
    // copy current search params
    const newParams = new URLSearchParams(urlQueryParams);
    // update params from API URI
    const apiParams = new URL(apiUri).searchParams;
    // idk why filters were updated so early
    updateHasFilters();
    // remove params not in new API URI
    for (const key of newParams.keys()) {
      // seperately check for presence of roomId param
      if (key === "roomId") continue;
      // remove otherwise
      if (!apiParams.has(key)) newParams.delete(key);
    }
    // add params from API URI
    for (const [key, value] of apiParams.entries()) {
      if (value != "") newParams.set(key, value);
    }
    // set as new search params of page
    // this will reflect in the url
    setUrlQueryParams(newParams);
  }, [urlQueryParams, apiUri, setUrlQueryParams, updateHasFilters]);

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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
              currentFilters={searchQuery}
              handleFilterChange={handleFilterChange}
              handleFilterClear={handleFilterClear}
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
                            {room.searchTags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} title={tag} className="tag search-tag">
                                {tag}
                              </span>
                            ))}
                            {room.majorTags.slice(0, 1).map((tag, idx) => (
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
                            onClick={() => handleViewRoom(room.id ?? "unknown")}
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
