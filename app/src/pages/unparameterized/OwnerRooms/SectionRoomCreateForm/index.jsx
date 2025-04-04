import React, { useEffect, useRef, useState } from "react";
import useDialog from "@/hooks/dialogbox.js";

import { base64FileDataToFile, fileToBase64FileData } from "@/modules/util/dataConversion.js";
import { CachePaths, createNewCacheUrl, putLastCacheUrl } from "@/modules/util/caching.js";
import { ApiPaths, apiPostOrPatchJson } from "@/modules/util/api.js";
import useNotification from "@/hooks/notification.js";

import PillsInput from "@/components/PillsInput/index.jsx";
import ButtonText from "@/components/ButtonText/index.jsx";
import { lang } from "@/modules/util/language.js";

import "./styles.css";

const SECTION_ROOM_FORM_CACHE_PATH = CachePaths.SECTION_ROOM_FORM;

/**
 * @typedef {import("@/modules/util/dataConversion.js").Base64FileData} Base64FileData
 * @typedef {"MALE" | "FEMALE" | "OTHER" | ""} GenderOptions
 * @typedef {"STUDENT" | "PROFESSIONAL" | "ANY" | ""} OccupationOptions
 */

/**
 * @typedef {Object} CachableDraftFormData
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
 * @property {Base64FileData[]} files
 */

/**
 * Renders the room creation form.
 *
 * When a `draftCacheUrl` is provided, the component attempts to load cached draft data and pre-populate the form fields.
 * It supports both saving draft data to the cache and submitting new room details to the backend.
 *
 * @param {Object} props - Component properties.
 * @param {string} [props.draftCacheUrl] - Optional URL to load saved draft form data.
 * @returns {JSX.Element} The rendered room creation form.
 */
export default function SectionRoomCreateForm({ draftCacheUrl }) {
  const viewOnly = false;

  const notify = useNotification();
  const dialog = useDialog();

  const [internalCacheUrl, setInternalCacheUrl] = useState(draftCacheUrl ?? "");

  const [acceptGender, setAcceptGender] = useState(/** @type {GenderOptions} */ (""));
  const [acceptOccupation, setAcceptOccupation] = useState(/** @type {OccupationOptions} */ (""));
  const [searchTagsSet, setSearchTagsSet] = useState(/** @type {Set<string>} */ (new Set()));
  const landmarkInput = /** @type {React.MutableRefObject<HTMLInputElement>} */ (useRef());
  const addressInput = /** @type {React.MutableRefObject<HTMLInputElement>} */ (useRef());
  const cityInput = /** @type {React.MutableRefObject<HTMLInputElement>} */ (useRef());
  const stateInput = /** @type {React.MutableRefObject<HTMLInputElement>} */ (useRef());
  const [majorTagsSet, setMajorTagsSet] = useState(/** @type {Set<string>} */ (new Set()));
  const [minorTagsSet, setMinorTagsSet] = useState(/** @type {Set<string>} */ (new Set()));
  const capacityInput = /** @type {React.MutableRefObject<HTMLInputElement>} */ (useRef());
  const pricePerOccupantInput = /** @type {React.MutableRefObject<HTMLInputElement>} */ (useRef());

  const [filesSet, setFilesSet] = useState(/** @type {Set<File>} */ (new Set()));

  const [submitAction, setSubmitAction] = useState(/** @type {"save-draft" | "submit"} */ ("save-draft"));

  const [submitButtonKind, setSubmitButtonKind] = useState(/** @type {"primary" | "loading"} */ ("primary"));

  /* useEffect to load cache data */
  useEffect(() => {
    // if draftCacheUrl not defined
    if (!draftCacheUrl) return;
    // if input elements not initialized
    if (
      !landmarkInput.current ||
      !addressInput.current ||
      !cityInput.current ||
      !stateInput.current ||
      !capacityInput.current ||
      !pricePerOccupantInput.current
    )
      return;

    caches
      .open(SECTION_ROOM_FORM_CACHE_PATH)
      .then((cache) => cache.match(draftCacheUrl))
      .then((response) => response?.json())
      .then((/** @type {CachableDraftFormData} */ data) => {
        if (!data) return;
        setAcceptGender(data.acceptGender);
        setAcceptOccupation(data.acceptOccupation);
        setSearchTagsSet(new Set(data.searchTags));
        if (landmarkInput.current) landmarkInput.current.value = data.landmark;
        if (addressInput.current) addressInput.current.value = data.address;
        if (cityInput.current) cityInput.current.value = data.city;
        if (stateInput.current) stateInput.current.value = data.state;
        setMajorTagsSet(new Set(data.majorTags));
        setMinorTagsSet(new Set(data.minorTags));
        if (capacityInput.current) capacityInput.current.value = "" + data.capacity;
        if (pricePerOccupantInput.current) pricePerOccupantInput.current.value = "" + data.pricePerOccupant;

        setFilesSet(new Set(data.files.map(base64FileDataToFile)));
      })
      .catch((e) => notify(e, "error"));
  }, [draftCacheUrl, landmarkInput, addressInput, cityInput, stateInput, capacityInput, pricePerOccupantInput, notify]);

  /**
   * Asynchronously processes the room form data based on the current submit action.
   *
   * This function converts selected file inputs to base64 data and constructs an object containing room details such as gender, occupation, tags, location information, capacity, and pricing. When the submit action is "save-draft", it serializes and caches the form data locally using the Cache API, updating the cached URL if necessary and notifying the user of the draft save. If the action is "submit", it sends the data to the backend via a POST request, cleans up the local cache, updates the submit button state, and notifies the user upon successful creation of a new room. Note that form event prevention should be handled synchronously by a separate function.
   *
   * @returns {Promise<void>} A promise that resolves when the operation completes.
   */
  async function handleSubmitAsync() {
    // e.preventDefault(); // <-- HAS to be done in handleSubmitSync synchronously
    const base64Files = await Promise.all(Array.from(filesSet).map(fileToBase64FileData));
    /**
     * @type {CachableDraftFormData}
     */
    const formData = {
      acceptGender,
      acceptOccupation,
      searchTags: Array.from(searchTagsSet),
      landmark: landmarkInput.current.value,
      address: addressInput.current.value,
      city: cityInput.current.value,
      state: stateInput.current.value,
      majorTags: Array.from(majorTagsSet),
      minorTags: Array.from(minorTagsSet),
      capacity: Number(capacityInput.current.value),
      pricePerOccupant: Number(pricePerOccupantInput.current.value),

      files: base64Files,
    };

    // save form data draft in cache
    if (submitAction === "save-draft") {
      const jsonString = JSON.stringify(formData);
      const cache = await caches.open(SECTION_ROOM_FORM_CACHE_PATH);
      const cacheUrl = internalCacheUrl || (await createNewCacheUrl(SECTION_ROOM_FORM_CACHE_PATH));
      await cache.put(cacheUrl, new Response(jsonString, { status: 200 }));
      if (internalCacheUrl !== cacheUrl) {
        // update last cache url if createNewCacheUrl called
        await putLastCacheUrl(SECTION_ROOM_FORM_CACHE_PATH, cacheUrl);
        // also update the internalCacheUrl
        setInternalCacheUrl(cacheUrl);
      }
      notify(
        lang(
          "Form draft saved to this computer",
          "ফর্মের ড্রাফ্ট এই কম্পিউটারে সেভ করা হলো",
          "फॉर्म ड्राफ्ट इस कंप्यूटर में सेव किया गया है"
        ),
        "success"
      );
    }

    // submit to backend
    else if (submitAction === "submit") {
      setSubmitButtonKind("loading");
      apiPostOrPatchJson("POST", ApiPaths.Rooms.create(), formData)
        .then(({ roomId }) => console.log("Created room w/ ID:", roomId))
        .then(() => caches.open(SECTION_ROOM_FORM_CACHE_PATH))
        .then((cache) => cache.delete(internalCacheUrl))
        .then(() => setSubmitButtonKind("primary"))
        .then(() => notify(lang("Created new room", "নতুন রুম তৈরি হয়েছে", "नया रूम बनाया गया"), "success"))
        // .then(() => dialog.hide())
        .catch((e) => {
          notify(e, "error");
          setSubmitButtonKind("primary");
        });
    }
  }

  /**
   * Synchronously handles the form submission event.
   *
   * Prevents the default submission to ensure caching updates occur first. It then validates that all required input
   * references (landmark, address, city, state, capacity, and price per occupant) are defined. If any reference is missing,
   * an error is logged and the user is notified. Otherwise, it delegates the processing to an asynchronous submission handler,
   * catching and notifying any errors that occur.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  function handleSubmitSync(e) {
    e.preventDefault(); // <-- this HAS to be synchronously or else the form will submit before the cache is updated

    if (
      !landmarkInput.current ||
      !addressInput.current ||
      !cityInput.current ||
      !stateInput.current ||
      !capacityInput.current ||
      !pricePerOccupantInput.current
    ) {
      console.error("undefined input refs");
      notify(
        lang("Input error, please try again", "ইনপুট ত্রুটি, আবার চেষ্টা করুন", "इनपुट त्रुटि, कृपया पुनः प्रयास करें"),
        "error"
      );
      return;
    }

    handleSubmitAsync().catch((e) => notify(e, "error"));
  }

  return (
    <form className="pages-OwnerRooms-SectionRoomForm form-container" onSubmit={(e) => handleSubmitSync(e)}>
      <div className="editable-container">
        <div className="textedit-container">
          <input
            required
            disabled={viewOnly}
            ref={landmarkInput}
            type="text"
            placeholder={lang("Landmark", "ল্যান্ডমার্ক", "लैंडमार्क")}
            name="landmark"
          />
          <input
            required
            disabled={viewOnly}
            ref={addressInput}
            type="text"
            placeholder={lang("Address", "ঠিকানা", "पता")}
            name="address"
          />
          <div className="pashapashi-container">
            <input
              required
              disabled={viewOnly}
              ref={cityInput}
              type="text"
              placeholder={lang("City", "শহর", "शहर")}
              name="city"
            />
            <input
              required
              disabled={viewOnly}
              ref={stateInput}
              type="text"
              placeholder={lang("State", "রাজ্য", "राज्य")}
              name="state"
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
            <input
              required
              disabled={viewOnly}
              ref={capacityInput}
              type="number"
              placeholder={lang("Capacity", "ক্ষমতা", "क्षमता")}
              name="capacity"
            />
            <input
              required
              disabled={viewOnly}
              ref={pricePerOccupantInput}
              type="number"
              placeholder={lang("Unit Rate", "একক হার", "इकाई दर")}
              name="pricePerOccupant"
            />
          </div>

          <select
            required
            value={acceptGender}
            onChange={(e) => setAcceptGender(/** @type {GenderOptions} */ (e.target.value))}
          >
            <option value="">{lang("Choose gender", "লিঙ্গ নির্বাচন করুন", "लिंग चुनें")}</option>
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
        </div>

        <div className="filedit-container">{/* TODO: Add multi-file input */}</div>
      </div>

      <div className="submit-container">
        <ButtonText
          disabled={viewOnly}
          name="save-draft"
          title={lang("Save Draft", "ড্রাফ্ট সংরক্ষণ করুন", "ड्राफ्ट सेव करें")}
          rounded="all"
          kind="secondary"
          onClick={() => setSubmitAction("save-draft")}
        />
        <ButtonText
          disabled={viewOnly}
          width="15%"
          name="submit"
          title={lang("New Room", "নতুন রুম", "नया रूम")}
          rounded="all"
          kind={submitButtonKind}
          onClick={() => setSubmitAction("submit")}
        />
      </div>

      <i className="btn-close fa fa-close" onClick={() => dialog.hide()} />
    </form>
  );
}
