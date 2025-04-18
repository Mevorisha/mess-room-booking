import React, { useState, useEffect, useCallback } from "react";
import { apiGetOrDelete, ApiPaths } from "@/modules/util/api";
import { RoomData } from "@/modules/networkTypes/Room";
import { lang } from "@/modules/util/language";
import useNotification from "@/hooks/notification";
import PagingContainer from "@/components/PagingContainer";
import ImageLoader from "@/components/ImageLoader";
import useDialogBox from "@/hooks/dialogbox";
import FilterSearch from "@/components/FilterSearch";
import { RoomQuery } from "@/modules/networkTypes/Room";

import "./styles.css";
import ButtonText from "@/components/ButtonText";

export interface SectionSearchProps {
  initialQuery?: Partial<RoomQuery>;
}

export default function SectionSearch({ initialQuery = {} }: SectionSearchProps): React.ReactNode {
  const notify = useNotification();
  const dialog = useDialogBox();

  // State for rooms data
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResuts, setTotalResuts] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // State for search query
  const [query, setQuery] = useState<RoomQuery>({ ...initialQuery, page: 1 });

  // State for search input
  const [searchInput, setSearchInput] = useState<string>("");

  // State to track if filters are applied
  const [hasFilters, setHasFilters] = useState<boolean>(false);

  // Check if we're on mobile view
  const [isMobileView, setIsMobileView] = useState<boolean>(window.innerWidth < 750);

  // Effect to handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 750);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Function to handle search
  function handleSearch() {
    // Update query with search input as landmark
    setQuery((prev) => ({ ...prev, landmark: searchInput.trim(), page: 1 }));
  }

  // Function to handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<RoomQuery>) => {
    setQuery((prev) => ({ ...prev, ...newFilters, page: 1 }));
    // Check if any filters are applied
    const filterKeys = Object.keys(newFilters) as (keyof RoomQuery)[];
    setHasFilters(
      filterKeys.some(
        (key) => newFilters[key] !== undefined && key !== "page" && key !== "invalidateCache" && key !== "landmark"
      )
    );
  }, []);

  // Function to handle clearing filters
  const handleFilterClear = useCallback(() => {
    const clearedQuery: RoomQuery = {};
    setQuery(clearedQuery);
    setHasFilters(false);
  }, []);

  // Function to open filters dialog on mobile
  function handleOpenFiltersDialog() {
    dialog.show(
      <FilterSearch
        currentFilters={query}
        handleFilterChange={handleFilterChange}
        handleFilterClear={handleFilterClear}
        isDialog={true}
      />,
      "small"
    );
  }

  // Function to load rooms data
  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiGetOrDelete("GET", ApiPaths.Rooms.readListOnQuery(query));
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
  }, [notify, query]);

  // Handle page change
  function handlePageChange(page: number) {
    setCurrentPage(page);
    setQuery((prev) => ({ ...prev, page }));
  }

  // Load rooms when query changes
  useEffect(() => void loadRooms().catch((e: Error) => notify(e, "error")), [loadRooms, notify, query]);

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
              currentFilters={query}
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
                          <ImageLoader src={room.images[0]?.medium ?? ""} alt={room.landmark} />
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
                            onClick={() => {
                              /* Placeholder for view details function */
                            }}
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
