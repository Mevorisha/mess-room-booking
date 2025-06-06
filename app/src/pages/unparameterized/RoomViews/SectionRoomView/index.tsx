import React, { useState } from "react";
import useDialog from "@/hooks/dialogbox.js";

import { lang } from "@/modules/util/language.js";
import StringySet from "@/modules/classes/StringySet";
import { RoomData } from "@/modules/networkTypes/Room";

import PillsInput from "@/components/PillsInput/index.jsx";
import ImageFilesInput from "@/components/ImageFilesInput";
import FileRepr from "@/modules/classes/FileRepr";

import "./styles.css";

export interface SectionRoomViewProps {
  roomData: RoomData;
  reloadApi?: (params?: { page?: number; invalidateCache?: boolean }) => Promise<void>;
}

export default function SectionRoomView({ roomData, reloadApi: _ }: SectionRoomViewProps): React.ReactNode {
  const viewOnly = true;

  const dialog = useDialog();

  const [searchTagsSet, setSearchTagsSet] = useState<Set<string>>(new Set<string>(roomData.searchTags));
  const [majorTagsSet, setMajorTagsSet] = useState<Set<string>>(new Set<string>(roomData.majorTags));
  const [minorTagsSet, setMinorTagsSet] = useState<Set<string>>(new Set<string>(roomData.minorTags));

  // Initialize filesSet with images from roomData
  const [filesSet, setFilesSet] = useState(
    new StringySet<FileRepr>(roomData.images.map((img) => FileRepr.from(img.medium)))
  );

  return (
    <form className="pages-OwnerRooms-SectionRoomForm form-container" onSubmit={(e) => e.preventDefault()}>
      <h1 className="heading">{lang("View Room Details", "রুমের তথ্য দেখুন", "रूम डिटेल्स देखें")}</h1>

      <div className="editable-container">
        <div className="textedit-container">
          <input
            required
            disabled={viewOnly}
            type="text"
            placeholder={lang("Landmark", "ল্যান্ডমার্ক", "लैंडमार्क")}
            name="landmark"
            value={roomData.landmark}
          />
          <input
            required
            disabled={viewOnly}
            type="text"
            placeholder={lang("Address", "ঠিকানা", "पता")}
            name="address"
            value={roomData.address}
          />
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
          <PillsInput
            required
            disabled={viewOnly}
            placeholder={lang("Set Search Tags", "সার্চ ট্যাগ সেট করুন", "सर्च टैग सेट करें")}
            pillsSet={searchTagsSet}
            setPillsSet={setSearchTagsSet}
          />
          <PillsInput
            required
            disabled={viewOnly}
            placeholder={lang("Set major tags", "প্রধান ট্যাগ সেট করুন", "मुख्य टैग सेट करें")}
            pillsSet={majorTagsSet}
            setPillsSet={setMajorTagsSet}
          />
          <PillsInput
            disabled={viewOnly}
            placeholder={lang("Set minor tags", "গৌণ ট্যাগ সেট করুন", "छोटे टैग सेट करें")}
            pillsSet={minorTagsSet}
            setPillsSet={setMinorTagsSet}
          />
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

          <select disabled value={roomData.acceptGender ?? ""}>
            <option value="MALE">{lang("Male", "পুরুষ", "पुरुष")}</option>
            <option value="FEMALE">{lang("Female", "মহিলা", "महिला")}</option>
            <option value="OTHER">{lang("Other", "অন্যান্য", "अन्य")}</option>
          </select>

          <select disabled value={roomData.acceptOccupation ?? ""}>
            <option value="">{lang("Choose occupation", "পেশা নির্বাচন করুন", "पेशा चुनें")}</option>
            <option value="STUDENT">{lang("Student", "ছাত্র", "छात्र")}</option>
            <option value="PROFESSIONAL">{lang("Professional", "পেশাদার", "प्रोफेशनल")}</option>
            <option value="ANY">{lang("Any", "যেকোনো", "कोई भी")}</option>
          </select>
        </div>

        <div className="filedit-container">
          <ImageFilesInput required disabled={viewOnly} minRequired={2} filesSet={filesSet} setFilesSet={setFilesSet} />
        </div>
      </div>

      <i className="btn-close fa fa-close" onClick={() => dialog.hide()} />
    </form>
  );
}
