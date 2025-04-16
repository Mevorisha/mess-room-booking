import React, { useState, useEffect } from "react";
import { lang } from "@/modules/util/language";
import ButtonText from "@/components/ButtonText";
import { RoomQuery } from "@/modules/networkTypes/Room";
import useDialogBox from "@/hooks/dialogbox";

import "./styles.css";

interface FilterSearchProps {
  currentFilters: RoomQuery;
  handleFilterChange: (filters: Partial<RoomQuery>) => void;
  handleFilterClear: () => void;
  isDialog?: boolean;
}

export default function FilterSearch({
  currentFilters,
  handleFilterChange,
  handleFilterClear,
  isDialog = false,
}: FilterSearchProps): React.ReactNode {
  const dialog = useDialogBox();

  // Local state for filter values
  const [genderFilter, setGenderFilter] = useState<RoomQuery["acceptGender"]>(currentFilters.acceptGender);
  const [occupationFilter, setOccupationFilter] = useState<RoomQuery["acceptOccupation"]>(
    currentFilters.acceptOccupation
  );
  const [capacityFilter, setCapacityFilter] = useState<number | undefined>(currentFilters.capacity);
  const [priceRange, setPriceRange] = useState<{ low: number | undefined; high: number | undefined }>({
    low: currentFilters.lowPrice,
    high: currentFilters.highPrice,
  });
  const [sortOption, setSortOption] = useState<{
    sortOn?: RoomQuery["sortOn"];
    sortOrder?: RoomQuery["sortOrder"];
  }>({
    sortOn: currentFilters.sortOn,
    sortOrder: currentFilters.sortOrder,
  });

  // Update local state when currentFilters change
  useEffect(() => {
    setGenderFilter(currentFilters.acceptGender);
    setOccupationFilter(currentFilters.acceptOccupation);
    setCapacityFilter(currentFilters.capacity);
    setPriceRange({
      low: currentFilters.lowPrice,
      high: currentFilters.highPrice,
    });
    setSortOption({
      sortOn: currentFilters.sortOn,
      sortOrder: currentFilters.sortOrder,
    });
  }, [currentFilters]);

  // Apply filters
  function handleApplyAction() {
    // First, create an object with only the non-null fields
    const filterParams: Partial<RoomQuery> = {};
    // Add each property only if it's not null or undefined
    if (genderFilter != null) {
      filterParams.acceptGender = genderFilter;
    }
    if (occupationFilter != null) {
      filterParams.acceptOccupation = occupationFilter;
    }
    if (capacityFilter != null) {
      filterParams.capacity = capacityFilter;
    }
    if (priceRange.low != null) {
      filterParams.lowPrice = priceRange.low;
    }
    if (priceRange.high != null) {
      filterParams.highPrice = priceRange.high;
    }
    if (sortOption.sortOn != null) {
      filterParams.sortOn = sortOption.sortOn;
    }
    if (sortOption.sortOrder != null) {
      filterParams.sortOrder = sortOption.sortOrder;
    }
    // Pass only the non-null fields to the function
    handleFilterChange(filterParams);
  }

  // Clear all filters
  function handleClearAction() {
    // Reset to currentFilters
    setGenderFilter(currentFilters.acceptGender);
    setOccupationFilter(currentFilters.acceptOccupation);
    setCapacityFilter(currentFilters.capacity);
    setPriceRange({ low: currentFilters.lowPrice, high: currentFilters.highPrice });
    setSortOption({ sortOn: currentFilters.sortOn, sortOrder: currentFilters.sortOrder });
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
            className={`filter-option ${genderFilter === "MALE" ? "selected" : ""}`}
            onClick={() => setGenderFilter(genderFilter === "MALE" ? undefined : "MALE")}
          >
            {lang("Male", "পুরুষ", "पुरुष")}
          </div>
          <div
            className={`filter-option ${genderFilter === "FEMALE" ? "selected" : ""}`}
            onClick={() => setGenderFilter(genderFilter === "FEMALE" ? undefined : "FEMALE")}
          >
            {lang("Female", "মহিলা", "महिला")}
          </div>
          <div
            className={`filter-option ${genderFilter === "OTHER" ? "selected" : ""}`}
            onClick={() => setGenderFilter(genderFilter === "OTHER" ? undefined : "OTHER")}
          >
            {lang("Other", "অন্যান্য", "अन्य")}
          </div>
        </div>
      </div>

      <div className="filter-section">
        <h4>{lang("Occupation", "পেশা", "व्यवसाय")}</h4>
        <div className="filter-options">
          <div
            className={`filter-option ${occupationFilter === "STUDENT" ? "selected" : ""}`}
            onClick={() => setOccupationFilter(occupationFilter === "STUDENT" ? undefined : "STUDENT")}
          >
            {lang("Student", "ছাত্র", "छात्र")}
          </div>
          <div
            className={`filter-option ${occupationFilter === "PROFESSIONAL" ? "selected" : ""}`}
            onClick={() => setOccupationFilter(occupationFilter === "PROFESSIONAL" ? undefined : "PROFESSIONAL")}
          >
            {lang("Professional", "পেশাদার", "पेशेवर")}
          </div>
          <div
            className={`filter-option ${occupationFilter === "ANY" ? "selected" : ""}`}
            onClick={() => setOccupationFilter(occupationFilter === "ANY" ? undefined : "ANY")}
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
            onClick={() => setCapacityFilter(capacityFilter === 1 ? undefined : 1)}
          >
            1 {lang("Person", "জন", "व्यक्ति")}
          </div>
          <div
            className={`filter-option ${capacityFilter === 2 ? "selected" : ""}`}
            onClick={() => setCapacityFilter(capacityFilter === 2 ? undefined : 2)}
          >
            2 {lang("People", "জন", "लोग")}
          </div>
          <div
            className={`filter-option ${capacityFilter === 3 ? "selected" : ""}`}
            onClick={() => setCapacityFilter(capacityFilter === 3 ? undefined : 3)}
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
            value={priceRange.high ?? "(unset)"}
            onChange={(e) => setPriceRange({ ...priceRange, high: Number(e.target.value) })}
            min={priceRange.low ?? 0}
          />
        </div>
      </div>

      <div className="filter-section">
        <h4>{lang("Sort By", "সাজান", "सॉर्ट करें")}</h4>
        <div className="sort-options">
          <select
            value={`${sortOption.sortOn ?? "(unset)"}-${sortOption.sortOrder ?? "(unset)"}`}
            onChange={(e) => {
              const [sortOn, sortOrder] = e.target.value.split("-") as [RoomQuery["sortOn"], RoomQuery["sortOrder"]];
              setSortOption({ sortOn: sortOn, sortOrder: sortOrder });
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
