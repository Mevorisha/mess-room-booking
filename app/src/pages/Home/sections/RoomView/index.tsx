import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useDialog from "@/hooks/dialogbox.js";

import { lang } from "@/modules/util/language.js";
import StringySet from "@/modules/classes/StringySet";
import { RoomData } from "@/modules/networkTypes/Room";
import { PagePaths, PageType } from "@/modules/util/pageUrls";

import ButtonText from "@/components/ButtonText";
import ImageFilesInput from "@/components/ImageFilesInput";
import FileRepr from "@/modules/classes/FileRepr";

import "./styles.css";

interface TagsDisplayProps {
  tags: string[];
  title: string;
  colorClass: string;
}

function TagsDisplay({ tags, title, colorClass }: TagsDisplayProps): React.ReactNode {
  return (
    <div className="tags-display-container">
      <label className="form-label">{title}</label>
      <div className="tags-display">
        {tags.length > 0 ? (
          tags.map((tag, index) => (
            <span key={index} className={`tag-pill ${colorClass}`}>
              {tag}
            </span>
          ))
        ) : (
          <span className="no-tags">{lang("No tags", "কোনো ট্যাগ নেই", "कोई टैग नहीं")}</span>
        )}
      </div>
    </div>
  );
}

export interface SectionRoomViewProps {
  roomData: RoomData;
  showBookingButton?: boolean;
  setIsRoomViewVisible?: (value: React.SetStateAction<boolean>) => void;
  reloadApi?: (params?: { page?: number; invalidateCache?: boolean }) => Promise<void>;
}

export default function SectionRoomView({
  roomData,
  showBookingButton = true,
  setIsRoomViewVisible,
  reloadApi: _,
}: SectionRoomViewProps): React.ReactNode {
  const viewOnly = true;

  const dialog = useDialog();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const majorTagsSet = new Set<string>(roomData.majorTags);
  const minorTagsSet = new Set<string>(roomData.minorTags);

  // Initialize filesSet with images from roomData
  const filesSet = new StringySet<FileRepr>(roomData.images.map((img) => FileRepr.from(img.medium)));

  function handleOpenOwnerProfile() {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("id", roomData.ownerId);
    dialog.hide();
    navigate({
      pathname: PagePaths[PageType.PROFILE],
      search: newSearchParams.toString(),
    });
  }

  function handleRequestBooking(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
  }

  return (
    <form className="pages-Home-sections-RoomView form-container" onSubmit={handleRequestBooking}>
      <h1 className="heading">{lang("View Room Details", "রুমের তথ্য দেখুন", "रूम डिटेल्स देखें")}</h1>

      <div className="editable-container">
        <div className="textedit-container">
          <label className="form-label">{lang("Landmark", "ল্যান্ডমার্ক", "लैंडमार्क")}</label>
          <input
            required
            disabled={viewOnly}
            type="text"
            placeholder={lang("Landmark", "ল্যান্ডমার্ক", "लैंडमार्क")}
            name="landmark"
            value={roomData.landmark}
          />

          <label className="form-label">{lang("Address", "ঠিকানা", "पता")}</label>
          <div className="address">{roomData.address}</div>

          <label className="form-label">{lang("Location", "অবস্থান", "स्थान")}</label>
          <div className="pashapashi-container">
            <input
              required
              disabled={viewOnly}
              type="text"
              placeholder={lang("City", "শহর", "शहर")}
              name="city"
              value={roomData.city}
            />
            <input
              required
              disabled={viewOnly}
              type="text"
              placeholder={lang("State", "রাজ্য", "राज्य")}
              name="state"
              value={roomData.state}
            />
          </div>

          <TagsDisplay
            tags={Array.from(majorTagsSet)}
            title={lang("Major Tags", "প্রধান ট্যাগ", "मुख्य टैग")}
            colorClass="major-tag"
          />

          <TagsDisplay
            tags={Array.from(minorTagsSet)}
            title={lang("Minor Tags", "গৌণ ট্যাগ", "छोटे टैग")}
            colorClass="minor-tag"
          />

          <label className="form-label">{lang("Room Details", "রুমের বিবরণ", "रूम विवरण")}</label>
          <div className="pashapashi-container">
            <span className="input-span">
              <span className="text">{lang("Capacity: ", "ক্ষমতা: ", "क्षमता: ")}</span>
              <input
                required
                disabled={viewOnly}
                type="number"
                placeholder={lang("Capacity", "ক্ষমতা", "क्षमता")}
                name="capacity"
                value={roomData.capacity}
              />
            </span>
            <span className="input-span">
              <span className="text">{lang("Rate: ", "হার: ", "दर: ")}</span>
              <input
                required
                disabled={viewOnly}
                type="text"
                placeholder={lang("Unit Rate", "একক হার", "इकाई दर")}
                name="pricePerOccupant"
                value={"₹ " + roomData.pricePerOccupant}
              />
            </span>
          </div>

          <label className="form-label">{lang("Accepted Gender", "গ্রহণযোগ্য লিঙ্গ", "स्वीकृत लिंग")}</label>
          <select disabled value={roomData.acceptGender ?? ""}>
            <option value="MALE">{lang("Male", "পুরুষ", "पुरुष")}</option>
            <option value="FEMALE">{lang("Female", "মহিলা", "महिला")}</option>
            <option value="OTHER">{lang("Other", "অন্যান্য", "अन्य")}</option>
          </select>

          <label className="form-label">{lang("Accepted Occupation", "গ্রহণযোগ্য পেশা", "स्वीकृत पेशा")}</label>
          <select disabled value={roomData.acceptOccupation ?? ""}>
            <option value="">{lang("Choose occupation", "পেশা নির্বাচন করুন", "पेशा चुनें")}</option>
            <option value="STUDENT">{lang("Student", "ছাত্র", "छात्र")}</option>
            <option value="PROFESSIONAL">{lang("Professional", "পেশাদার", "प्रोफेशनल")}</option>
            <option value="ANY">{lang("Any", "যেকোনো", "कोई भी")}</option>
          </select>

          <label className="form-label">{lang("Rating", "রেটিং", "रेटिंग")}</label>
          <div className="rating-display">
            <span className="rating-value">
              {roomData.rating != 0
                ? roomData.rating.toFixed(1)
                : lang("No rating", "কোনো রেটিং নেই", "कोई रेटिंग नहीं")}
            </span>
            {roomData.rating != 0 && (
              <div className="stars-display">
                {[...Array<React.ReactNode>(5)].map((_, i) => (
                  <span key={i} className={`star ${i < Math.floor(roomData.rating) ? "filled" : ""}`}>
                    ★
                  </span>
                ))}
              </div>
            )}
          </div>

          {roomData.ownerId.length > 0 && (
            <>
              <label className="form-label">{lang("Owner Info", "মালিকের তথ্য", "मालिक डिटेल्स")}</label>
              <input
                type="text"
                className="owner-details"
                value={lang("Owner Info", "মালিকের তথ্য", "मालिक डिटेल्स")}
                onClick={() => handleOpenOwnerProfile()}
                readOnly
              />
            </>
          )}
        </div>

        <div className="filedit-container">
          <label className="form-label">{lang("Room Images", "রুমের ছবি", "रूम इमेज")}</label>
          <ImageFilesInput required disabled={viewOnly} minRequired={2} filesSet={filesSet} setFilesSet={() => ({})} />
        </div>
      </div>

      <div className="submit-container">
        {showBookingButton && (
          <ButtonText
            disabled={viewOnly}
            width="15%"
            name="submit"
            title={lang("Ask for Room", "রুম চান", "रूम मांगें")}
            rounded="all"
            kind="primary"
          />
        )}
      </div>

      <i
        className="btn-close fa fa-close"
        onClick={() => {
          const newSearchParams = new URLSearchParams(searchParams);
          if (newSearchParams.has("roomId")) {
            newSearchParams.delete("roomId");
          }
          setSearchParams(newSearchParams);
          if (setIsRoomViewVisible != null) {
            setIsRoomViewVisible(false);
          }
          dialog.hide();
        }}
      />
    </form>
  );
}
