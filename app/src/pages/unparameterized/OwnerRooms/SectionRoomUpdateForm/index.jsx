import React, { useState } from "react";
import useDialog from "@/hooks/dialogbox.js";

import { fileToBase64FileData, sizehuman } from "@/modules/util/dataConversion.js";
import { lang } from "@/modules/util/language.js";
import { ApiPaths, apiPostOrPatchJson } from "@/modules/util/api.js";
import StringySet from "@/modules/classes/StringySet";
import useNotification from "@/hooks/notification.js";

import PillsInput from "@/components/PillsInput/index.jsx";
import ButtonText from "@/components/ButtonText/index.jsx";
import ImageFilesInput from "@/components/ImageFilesInput";
import FileRepr from "@/modules/classes/FileRepr";

import "./styles.css";

/**
 * @typedef {import("@/modules/util/dataConversion.js").Base64FileData} Base64FileData
 * @typedef {"MALE" | "FEMALE" | "OTHER"} GenderOptions
 * @typedef {"STUDENT" | "PROFESSIONAL" | "ANY" | ""} OccupationOptions
 */

/**
 * This is the data received from backend and used to populate the room form.
 * NOTE: `isUnavailable` is only set if room owner fetchig room details.
 * @typedef {Object} RoomData
 * @property {string} id
 * @property {string} ownerId
 * @property {Array<{ small: string, medium: string, large: string }>} images
 * @property {boolean} isUnavailable
 * @property {GenderOptions} acceptGender
 * @property {OccupationOptions} acceptOccupation
 * @property {string[]} searchTags
 * @property {string} landmark
 * @property {string} address
 * @property {string} city
 * @property {string} state
 * @property {string[]} majorTags
 * @property {string[]} minorTags
 * @property {number} capacity
 * @property {number} pricePerOccupant
 */

/**
 * This is the data to be sent to backend.
 * Fields absent in update data:
 * - `acceptGender`
 *
 *  Additional fields in update data:
 * - `keepFiles` - Keep images after update, delete others
 * - `addFiles` - Upload new images
 * @typedef {Object} RoomUpdateData
 * @property {boolean} isUnavailable
 * @property {OccupationOptions} acceptOccupation
 * @property {string[]} searchTags
 * @property {string} landmark
 * @property {string} address
 * @property {string} city
 * @property {string} state
 * @property {string[]} majorTags
 * @property {string[]} minorTags
 * @property {number} capacity
 * @property {number} pricePerOccupant
 * @property {string[]} keepFiles
 * @property {Base64FileData[]} addFiles
 */

/**
 * @param {{ roomData: RoomData }} props
 * @returns {React.JSX.Element}
 */
export default function SectionRoomUpdateForm({ roomData }) {
  const viewOnly = false;

  const notify = useNotification();
  const dialog = useDialog();

  // Replace all useRefs with state variables
  const [acceptGender, _] = useState(roomData.acceptGender);
  const [acceptOccupation, setAcceptOccupation] = useState(roomData.acceptOccupation);
  const [searchTagsSet, setSearchTagsSet] = useState(new Set(roomData.searchTags));
  const [landmark, setLandmark] = useState(roomData.landmark);
  const [address, setAddress] = useState(roomData.address);
  const [city, setCity] = useState(roomData.city);
  const [state, setState] = useState(roomData.state);
  const [majorTagsSet, setMajorTagsSet] = useState(new Set(roomData.majorTags));
  const [minorTagsSet, setMinorTagsSet] = useState(new Set(roomData.minorTags));
  const [capacity, setCapacity] = useState("" + roomData.capacity);
  const [pricePerOccupant, setPricePerOccupant] = useState("" + roomData.pricePerOccupant);
  const [isUnavailable, setIsUnavailable] = useState(roomData.isUnavailable);

  // Initialize filesSet with images from roomData
  const [filesSet, setFilesSet] = useState(new StringySet(roomData.images.map((img) => FileRepr.from(img.medium))));

  const [submitButtonKind, setSubmitButtonKind] = useState(/** @type {"primary" | "loading"} */ ("primary"));

  async function handleSubmitAsync() {
    // add new files
    const addFilesArr = Array.from(filesSet)
      .filter((fr) => fr.isFile())
      .map((fr) => fr.getFile());

    // keep URLs, and delete all others
    const keepFilesArr = Array.from(filesSet)
      .filter((fr) => fr.isUri())
      .map((fr) => fr.getUri());

    const base64Images = await Promise.all(addFilesArr.map(fileToBase64FileData));

    /**
     * @type {RoomUpdateData}
     */
    const formData = {
      isUnavailable,
      acceptOccupation,
      searchTags: Array.from(searchTagsSet),
      landmark,
      address,
      city,
      state,
      majorTags: Array.from(majorTagsSet),
      minorTags: Array.from(minorTagsSet),
      capacity: Number(capacity),
      pricePerOccupant: Number(pricePerOccupant),

      keepFiles: keepFilesArr,
      addFiles: base64Images,
    };

    // submit to backend
    setSubmitButtonKind("loading");
    let totalSize = addFilesArr.reduce((acc, f) => acc + f.size, 0);

    notify(
      lang(
        `Uploading ${sizehuman(totalSize)}. This may take a long time. Please be patient.`,
        `${sizehuman(totalSize)} আপলোড হচ্ছে। এটি অনেক সময় নিতে পারে। দয়া করে ধৈর্য ধরুন।`,
        `${sizehuman(totalSize)} अपलोड हो रहा है। इसमें बहुत समय लग सकता है। कृपया धैर्य रखें।`
      ),
      "info"
    );

    apiPostOrPatchJson("PATCH", ApiPaths.Rooms.updateParams(roomData.id), formData)
      .then(({ roomId }) => console.log("Updated room w/ ID:", roomId))
      .then(() => setSubmitButtonKind("primary"))
      .then(() => notify(lang("Room updated", "রুম আপডেট হয়েছে", "रूम अपडेट हो गया है"), "success"))
      .then(() => dialog.hide())
      .catch((e) => {
        notify(e, "error");
        setSubmitButtonKind("primary");
      });
  }

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   * @returns {void}
   */
  function handleSubmitSync(e) {
    e.preventDefault();
    handleSubmitAsync().catch((e) => notify(e, "error"));
  }

  return (
    <form className="pages-OwnerRooms-SectionRoomForm form-container" onSubmit={(e) => handleSubmitSync(e)}>
      <h1 className="heading">{lang("Update Room", "রুম আপডেট করুন", "रूम अपडेट करें")}</h1>

      <div className="editable-container">
        <div className="textedit-container">
          <input
            required
            disabled={viewOnly}
            type="text"
            placeholder={lang("Landmark", "ল্যান্ডমার্ক", "लैंडमार्क")}
            name="landmark"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
          />
          <input
            required
            disabled={viewOnly}
            type="text"
            placeholder={lang("Address", "ঠিকানা", "पता")}
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <div className="pashapashi-container">
            <input
              required
              disabled={viewOnly}
              type="text"
              placeholder={lang("City", "শহর", "शहर")}
              name="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <input
              required
              disabled={viewOnly}
              type="text"
              placeholder={lang("State", "রাজ্য", "राज्य")}
              name="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
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
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
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
                value={pricePerOccupant}
                onChange={(e) => setPricePerOccupant(e.target.value)}
              />
            </span>
          </div>

          <select disabled value={acceptGender}>
            <option value="MALE">{lang("Male", "পুরুষ", "पुरुष")}</option>
            <option value="FEMALE">{lang("Female", "মহিলা", "महिला")}</option>
            <option value="OTHER">{lang("Other", "অন্যান্য", "अन्य")}</option>
          </select>

          <select
            required
            value={acceptOccupation}
            onChange={(e) => setAcceptOccupation(/** @type {OccupationOptions} */ (e.target.value))}
          >
            <option value="">{lang("Choose occupation", "পেশা নির্বাচন করুন", "पेशा चुनें")}</option>
            <option value="STUDENT">{lang("Student", "ছাত্র", "छात्र")}</option>
            <option value="PROFESSIONAL">{lang("Professional", "পেশাদার", "प्रोफेशनल")}</option>
            <option value="ANY">{lang("Any", "যেকোনো", "कोई भी")}</option>
          </select>

          {/* Added unavailable checkbox with styling */}
          <div className="checkbox-container">
            <label htmlFor="isUnavailable" className="checkbox-label">
              <input
                type="checkbox"
                id="isUnavailable"
                name="isUnavailable"
                checked={isUnavailable}
                onChange={(e) => setIsUnavailable(e.target.checked)}
                disabled={viewOnly}
              />
              <span className="checkbox-text">
                {lang("Mark as unavailable", "অনুপলব্ধ হিসাবে চিহ্নিত করুন", "अनुपलब्ध के रूप में चिह्नित करें")}
              </span>
            </label>
          </div>
        </div>

        <div className="filedit-container">
          <ImageFilesInput required minRequired={2} filesSet={filesSet} setFilesSet={setFilesSet} />
        </div>
      </div>

      <div className="submit-container">
        <ButtonText
          disabled={viewOnly}
          width="15%"
          name="submit"
          title={lang("Update Room", "রুম আপডেট করুন", "रूम अपडेट करें")}
          rounded="all"
          kind={submitButtonKind}
        />
      </div>

      <i className="btn-close fa fa-close" onClick={() => dialog.hide()} />
    </form>
  );
}
