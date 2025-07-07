import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useDialog from "@/hooks/dialogbox.js";

import { lang } from "@/modules/util/language.js";
import StringySet from "@/modules/classes/StringySet";
import { RoomData } from "@/modules/networkTypes/Room";

import ImageFilesInput from "@/components/ImageFilesInput";
import FileRepr from "@/modules/classes/FileRepr";

import "./styles.css";
import { PagePaths, PageType } from "@/modules/util/pageUrls";

export interface SectionRoomViewProps {
  roomData: RoomData;
  reloadApi?: (params?: { page?: number; invalidateCache?: boolean }) => Promise<void>;
}

export default function SectionRoomView({ roomData, reloadApi: _ }: SectionRoomViewProps): React.ReactNode {
  const viewOnly = true;

  const dialog = useDialog();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [majorTagsSet, _1] = useState<Set<string>>(new Set<string>(roomData.majorTags));
  const [minorTagsSet, _2] = useState<Set<string>>(new Set<string>(roomData.minorTags));

  // Initialize filesSet with images from roomData
  const [filesSet, setFilesSet] = useState(
    new StringySet<FileRepr>(roomData.images.map((img) => FileRepr.from(img.medium)))
  );

  function TagsDisplay({ tags, title, colorClass }: { tags: string[]; title: string; colorClass: string }) {
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

  function handleOpenOwnerProfile() {
    searchParams.set("id", roomData.ownerId);
    navigate({
      pathname: PagePaths[PageType.PROFILE],
      search: searchParams.toString(),
    });
    dialog.hide();
  }

  return (
    <form className="pages-OwnerRooms-SectionRoomForm form-container" onSubmit={(e) => e.preventDefault()}>
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
          <input
            required
            disabled={viewOnly}
            type="text"
            placeholder={lang("Address", "ঠিকানা", "पता")}
            name="address"
            value={roomData.address}
          />

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
              <span className="text">{lang("No.", "নং", "सं.")}</span>
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
              <span className="text">₹</span>
              <input
                required
                disabled={viewOnly}
                type="number"
                placeholder={lang("Unit Rate", "একক হার", "इकाई दर")}
                name="pricePerOccupant"
                value={roomData.pricePerOccupant}
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
          <ImageFilesInput required disabled={viewOnly} minRequired={2} filesSet={filesSet} setFilesSet={setFilesSet} />
        </div>
      </div>

      <i className="btn-close fa fa-close" onClick={() => dialog.hide()} />
    </form>
  );
}
