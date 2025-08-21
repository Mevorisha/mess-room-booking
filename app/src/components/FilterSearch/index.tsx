import React, { useState, useEffect } from "react";
import { lang } from "@/modules/util/language";
import ButtonText from "@/components/ButtonText";
import useDialog from "@/hooks/dialogbox";
import { GenderOptions, OccupationOptions } from "@/pages/Home/sections/RoomCreateForm";
import { AcceptGender, AcceptOccupation, RoomGetReqQueryParamsWrapper } from "sharedtypes";

import "./styles.css";
import { QuerySortOrder, RoomSortFields } from "sharedtypes/dist/types/typeEnums";

interface FilterSearchProps {
  currentFilters: RoomGetReqQueryParamsWrapper;
  handleFilterChange: (filters: RoomGetReqQueryParamsWrapper) => void;
  handleFilterClear: () => void;
  isDialog?: boolean;
}

export default function FilterSearch({
  currentFilters,
  handleFilterChange,
  handleFilterClear,
  isDialog = false,
}: FilterSearchProps): React.ReactNode {
  const dialog = useDialog();

  // Local state for filter values
  const [genderFilter, setGenderFilter] = useState<GenderOptions>(currentFilters.get("acceptGender"));
  const [occupationFilter, setOccupationFilter] = useState<OccupationOptions>(currentFilters.get("acceptOccupation"));
  const [capacityFilter, setCapacityFilter] = useState<number | null>(currentFilters.get("capacity"));
  const [priceRange, setPriceRange] = useState<{ low: number | null; high: number | null }>({
    low: currentFilters.get("lowPrice"),
    high: currentFilters.get("highPrice"),
  });
  const [sortOption, setSortOption] = useState<{
    sortOn?: RoomSortFields | null;
    sortOrder?: QuerySortOrder | null;
  }>({
    sortOn: currentFilters.get("sortOn"),
    sortOrder: currentFilters.get("sortOrder"),
  });

  // Update local state when currentFilters change
  useEffect(() => {
    setGenderFilter(currentFilters.get("acceptGender") ?? null);
    setOccupationFilter(currentFilters.get("acceptOccupation") ?? null);
    setCapacityFilter(currentFilters.get("capacity") ?? null);
    setPriceRange({ low: currentFilters.get("lowPrice"), high: currentFilters.get("highPrice") });
    setSortOption({ sortOn: currentFilters.get("sortOn"), sortOrder: currentFilters.get("sortOrder") });
  }, [currentFilters]);

  // Apply filters
  function handleApplyAction() {
    // First, create an object with only the non-null fields
    const filterParams = RoomGetReqQueryParamsWrapper.create();
    // Add each property only if it's not null or undefined
    if (genderFilter != null) {
      filterParams.set("acceptGender", genderFilter);
    }
    if (occupationFilter != null) {
      filterParams.set("acceptOccupation", occupationFilter);
    }
    if (capacityFilter != null) {
      filterParams.set("capacity", capacityFilter);
    }
    if (priceRange.low != null) {
      filterParams.set("lowPrice", priceRange.low);
    }
    if (priceRange.high != null) {
      filterParams.set("highPrice", priceRange.high);
    }
    if (sortOption.sortOn != null) {
      filterParams.set("sortOn", sortOption.sortOn);
    }
    if (sortOption.sortOrder != null) {
      filterParams.set("sortOrder", sortOption.sortOrder);
    }
    // Pass only the non-null fields to the function
    handleFilterChange(filterParams);
    if (isDialog) dialog.hide();
  }

  // Clear all filters
  function handleClearAction() {
    // Reset to currentFilters
    setGenderFilter(currentFilters.get("acceptGender"));
    setOccupationFilter(currentFilters.get("acceptOccupation"));
    setCapacityFilter(currentFilters.get("capacity"));
    setPriceRange({ low: currentFilters.get("lowPrice"), high: currentFilters.get("highPrice") });
    setSortOption({ sortOn: currentFilters.get("sortOn"), sortOrder: currentFilters.get("sortOrder") });
    handleFilterClear();
    if (isDialog) dialog.hide();
  }

  return (
    <div className={`components-FilterSearch ${isDialog ? "dialog-mode" : ""}`}>
      <div className="filter-header">
        <h3>{lang("Filters", "ফিল্টার", "फिल्टर")}</h3>
        {isDialog && <i className="btn-close fa fa-close" onClick={() => dialog.hide()} />}
        {!isDialog && (
          <button className="clear-filters-button" onClick={handleFilterClear}>
            {lang("Clear All", "সব পরিষ্কার করুন", "सभी साफ़ करें")}
          </button>
        )}
      </div>
      <div className="filter-section">
        <h4>{lang("Gender", "লিঙ্গ", "लिंग")}</h4>
        <div className="filter-options">
          <div
            className={`filter-option ${genderFilter === AcceptGender.MALE ? "selected" : ""}`}
            onClick={() => setGenderFilter(genderFilter === AcceptGender.MALE ? null : AcceptGender.MALE)}
          >
            {lang("Male", "পুরুষ", "पुरुष")}
          </div>
          <div
            className={`filter-option ${genderFilter === AcceptGender.FEMALE ? "selected" : ""}`}
            onClick={() => setGenderFilter(genderFilter === AcceptGender.FEMALE ? null : AcceptGender.FEMALE)}
          >
            {lang("Female", "মহিলা", "महिला")}
          </div>
          <div
            className={`filter-option ${genderFilter === AcceptGender.OTHER ? "selected" : ""}`}
            onClick={() => setGenderFilter(genderFilter === AcceptGender.OTHER ? null : AcceptGender.OTHER)}
          >
            {lang("Other", "অন্যান্য", "अन्य")}
          </div>
        </div>
      </div>

      <div className="filter-section">
        <h4>{lang("Occupation", "পেশা", "व्यवसाय")}</h4>
        <div className="filter-options">
          <div
            className={`filter-option ${occupationFilter === AcceptOccupation.STUDENT ? "selected" : ""}`}
            onClick={() => setOccupationFilter(occupationFilter === AcceptOccupation.STUDENT ? null : AcceptOccupation.STUDENT)} // prettier-ignore
          >
            {lang("Student", "ছাত্র", "छात्र")}
          </div>
          <div
            className={`filter-option ${occupationFilter === AcceptOccupation.PROFESSIONAL ? "selected" : ""}`}
            onClick={() => setOccupationFilter(occupationFilter === AcceptOccupation.PROFESSIONAL ? null : AcceptOccupation.PROFESSIONAL)} // prettier-ignore
          >
            {lang("Professional", "পেশাদার", "पेशेवर")}
          </div>
          <div
            className={`filter-option ${occupationFilter === AcceptOccupation.ANY ? "selected" : ""}`}
            onClick={() => setOccupationFilter(occupationFilter === AcceptOccupation.ANY ? null : AcceptOccupation.ANY)} // prettier-ignore
          >
            {lang("Any", "যেকোনো", "कोई भी")}
          </div>
        </div>
      </div>

      <div className="filter-section">
        <h4>{lang("Room Capacity", "রুম ক্যাপাসিটি", "रूम क्षमता")}</h4>
        <div className="filter-options">
          <div
            className={`filter-option ${capacityFilter === 1 ? "selected" : ""}`}
            onClick={() => setCapacityFilter(capacityFilter === 1 ? null : 1)}
          >
            1 {lang("Person", "জন", "व्यक्ति")}
          </div>
          <div
            className={`filter-option ${capacityFilter === 2 ? "selected" : ""}`}
            onClick={() => setCapacityFilter(capacityFilter === 2 ? null : 2)}
          >
            2 {lang("People", "জন", "लोग")}
          </div>
          <div
            className={`filter-option ${capacityFilter === 3 ? "selected" : ""}`}
            onClick={() => setCapacityFilter(capacityFilter === 3 ? null : 3)}
          >
            3+ {lang("People", "জন", "लोग")}
          </div>
        </div>
      </div>

      <div className="filter-section">
        <h4>{lang("Price Range (₹ per head)", "মূল্য সীমা (₹ প্রতি জনে)", "मूल्य सीमा (₹ प्रति व्यक्ति)")}</h4>
        <div className="price-range-inputs">
          <input
            type="number"
            placeholder={lang("Min", "সর্বনিম্ন", "न्यूनतम")}
            value={priceRange.low ?? ""}
            onChange={(e) => setPriceRange({ ...priceRange, low: Number(e.target.value) })}
            min="0"
          />
          <span className="range-separator">-</span>
          <input
            type="number"
            placeholder={lang("Max", "সর্বাধিক", "अधिकतम")}
            value={priceRange.high ?? ""}
            onChange={(e) => setPriceRange({ ...priceRange, high: Number(e.target.value) })}
            min={priceRange.low ?? 0}
          />
        </div>
      </div>

      <div className="filter-section">
        <h4>{lang("Sort By", "সাজান", "सॉर्ट करें")}</h4>
        <div className="sort-options">
          <select
            value={`${sortOption.sortOn ?? ""}-${sortOption.sortOrder ?? ""}`}
            onChange={(e) => {
              const [sortOn, sortOrder] = e.target.value.split("-") as [RoomSortFields | null, QuerySortOrder | null];
              setSortOption({ sortOn, sortOrder });
            }}
          >
            <option value="">{lang("Default", "ডিফল্ট", "डिफ़ॉल्ट")}</option>
            <option value="pricePerOccupant-asc">
              {lang("Price: Low to High", "মূল্য: কম থেকে বেশি", "मूल्य: कम से अधिक")}
            </option>
            <option value="pricePerOccupant-desc">
              {lang("Price: High to Low", "মূল্য: বেশি থেকে কম", "मूल्य: अधिक से कम")}
            </option>
            <option value="rating-desc">{lang("Highest Rated", "সর্বোচ্চ রেটেড", "उच्चतम रेटेड")}</option>
            <option value="capacity-asc">
              {lang("Capacity: Low to High", "ক্ষমতা: কম থেকে বেশি", "क्षमता: कम से अधिक")}
            </option>
            <option value="capacity-desc">
              {lang("Capacity: High to Low", "ক্ষমতা: বেশি থেকে কম", "क्षमता: अधिक से कम")}
            </option>
          </select>
        </div>
      </div>

      {isDialog && (
        <div className="dialog-actions">
          <ButtonText
            width="20%"
            rounded="all"
            title={lang("Cancel", "বাতিল করুন", "रद्द करें")}
            kind="secondary"
            onClick={handleClearAction}
          />
          <ButtonText
            width="20%"
            rounded="all"
            title={lang("Apply", "প্রয়োগ করুন", "लागू करें")}
            kind="primary"
            onClick={handleApplyAction}
          />
        </div>
      )}

      {!isDialog && (
        <div className="filter-actions not-dialog-mode">
          <ButtonText
            width="20%"
            rounded="all"
            title={lang("Apply", "প্রয়োগ করুন", "लागू करें")}
            kind="primary"
            onClick={handleApplyAction}
          />
        </div>
      )}
    </div>
  );
}
