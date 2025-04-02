import React, { useEffect, useRef, useState } from "react";
import useDialog from "../../../../hooks/dialogbox.js";

import { base64FileDataToFile, fileToBase64FileData } from "../../../../modules/util/dataConversion.js";
import { CachePaths, createNewCacheUrl, putLastCacheUrl } from "../../../../modules/util/caching.js";
import { ApiPaths, apiPostOrPatchJson } from "../../../../modules/util/api.js";
import useNotification from "../../../../hooks/notification.js";

import PillsInput from "../../../../components/PillsInput/index.jsx";
import ButtonText from "../../../../components/ButtonText/index.jsx";
import { lang } from "../../../../modules/util/language.js";

import "./styles.css";

const SECTION_ROOM_FORM_CACHE_PATH = CachePaths.SECTION_ROOM_FORM;

/**
 * @typedef {import("../../../../modules/util/dataConversion.js").Base64FileData} Base64FileData
 */

/**
 * @typedef {Object} CachableDraftFormData
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
 * If `mode` is "READ", "EDIT" or "DELETE", either `roomId` or if a draft, `viewDraftCacheUrl` must be provided.
 * NOTE: Error will happen if none is provided during "READ", "EDIT" or "DELETE".
 * @param {{ roomId?: string, viewDraftCacheUrl?: string, mode: "CREATE" | "UPDATE" | "READ" | "DELETE" }} props
 * @returns {JSX.Element}
 */
export default function SectionRoomForm({ roomId, viewDraftCacheUrl, mode }) {
  const viewOnly = mode === "READ" || mode === "DELETE";

  const notify = useNotification();
  const dialog = useDialog();

  const [internalCacheUrl, setInternalCacheUrl] = useState(viewDraftCacheUrl ?? "");

  const [draftButtonKind, setDraftButtonKind] = useState(/** @type {"secondary" | "loading"} */ ("secondary"));
  const [submitButtonKind, setSubmitButtonKind] = useState(/** @type {"primary" | "loading"} */ ("primary"));

  const landmarkInput = /** @type {React.MutableRefObject<HTMLInputElement>} */ (useRef());
  const addressInput = /** @type {React.MutableRefObject<HTMLInputElement>} */ (useRef());
  const cityInput = /** @type {React.MutableRefObject<HTMLInputElement>} */ (useRef());
  const stateInput = /** @type {React.MutableRefObject<HTMLInputElement>} */ (useRef());
  const capacityInput = /** @type {React.MutableRefObject<HTMLInputElement>} */ (useRef());
  const pricePerOccupantInput = /** @type {React.MutableRefObject<HTMLInputElement>} */ (useRef());

  const [searchTagsSet, setSearchTagsSet] = useState(/** @type {Set<string>} */ (new Set()));
  const [majorTagsSet, setMajorTagsSet] = useState(/** @type {Set<string>} */ (new Set()));
  const [minorTagsSet, setMinorTagsSet] = useState(/** @type {Set<string>} */ (new Set()));
  const [filesSet, setFilesSet] = useState(/** @type {Set<File>} */ (new Set()));

  const [submitAction, setSubmitAction] = useState(
    /** @type {"save-draft" | "submit-create" | "submit-update" | "submit-delete"} */ ("save-draft")
  );

  if (["READ", "EDIT", "DELETE"].includes(mode)) {
    if (!roomId && !viewDraftCacheUrl) {
      throw new Error("SectionRoomForm: provide either 'roomId' or 'viewDraftCacheUrl'");
    }
  }

  /**
   * @param {"not-loading" | "loading"} kind
   */
  function setActiveButtonKind(kind) {
    if (submitAction.startsWith("submit-")) {
      setSubmitButtonKind(kind === "loading" ? "loading" : "primary");
    }
    if (submitAction === "save-draft") {
      setDraftButtonKind(kind === "loading" ? "loading" : "secondary");
    }
  }

  /* useEffect to load cache data */
  useEffect(() => {
    // if neither roomId nor viewDraftCacheUrl defined
    if (!roomId || !viewDraftCacheUrl) return;
    // if input elements not initialized
    if (!landmarkInput.current || !addressInput.current || !cityInput.current || !stateInput.current) return;

    if (viewDraftCacheUrl) {
      caches
        .open(SECTION_ROOM_FORM_CACHE_PATH)
        .then((cache) => cache.match(internalCacheUrl))
        .then((response) => response?.json())
        .then((/** @type {CachableDraftFormData} */ data) => {
          if (!data) return;
          setSearchTagsSet(new Set(data.searchTags));
          if (landmarkInput.current) landmarkInput.current.value = data.landmark;
          if (addressInput.current) addressInput.current.value = data.address;
          if (cityInput.current) cityInput.current.value = data.city;
          if (stateInput.current) stateInput.current.value = data.state;
          if (capacityInput.current) capacityInput.current.value = "" + data.capacity;
          if (pricePerOccupantInput.current) pricePerOccupantInput.current.value = "" + data.pricePerOccupant;
          setMajorTagsSet(new Set(data.majorTags));
          setMinorTagsSet(new Set(data.minorTags));
          setFilesSet(new Set(data.files.map((fileData) => base64FileDataToFile(fileData))));
        })
        .catch((e) => notify(e, "error"));
    } else if (roomId) {
      // pull from db
    }
  }, [viewDraftCacheUrl, landmarkInput.current, addressInput.current, cityInput.current, stateInput.current]);

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   */
  async function handleSubmitAsync(e) {
    // e.preventDefault(); // <-- HAS to be done in handleSubmitSync synchronously

    const base64Files = await Promise.all(Array.from(filesSet).map(fileToBase64FileData));

    /**
     * @type {CachableDraftFormData}
     */
    const formData = {
      searchTags: Array.from(searchTagsSet),

      // @ts-ignore
      landmark: /** @type {string} */ (e.target.landmark.value),
      // @ts-ignore
      address: /** @type {string} */ (e.target.address.value),
      // @ts-ignore
      city: /** @type {string} */ (e.target.city.value),
      // @ts-ignore
      state: /** @type {string} */ (e.target.state.value),

      majorTags: Array.from(majorTagsSet),
      minorTags: Array.from(minorTagsSet),

      // @ts-ignore
      capacity: /** @type {number} */ (Number(e.target.capacity.value)),
      // @ts-ignore
      pricePerOccupant: /** @type {number} */ (Number(e.target.pricePerOccupant.value)),

      files: base64Files,
    };

    const jsonString = JSON.stringify(formData);

    // save form data draft in cache
    if (submitAction === "save-draft") {
      const cache = await caches.open(SECTION_ROOM_FORM_CACHE_PATH);
      const newUrl = await createNewCacheUrl(SECTION_ROOM_FORM_CACHE_PATH);
      await cache.put(newUrl, new Response(jsonString, { status: 200 }));
      await putLastCacheUrl(SECTION_ROOM_FORM_CACHE_PATH, newUrl);
      setInternalCacheUrl(newUrl);
      notify(
        lang(
          "Form draft saved to this computer",
          "ফর্মের ড্রাফ্ট এই কম্পিউটারে সেভ করা হলো",
          "फॉर्म ड्राफ्ट इस कंप्यूटर में सेव किया गया है"
        ),
        "success"
      );
    }

    if (submitAction === "submit-create") {
      apiPostOrPatchJson("POST", ApiPaths.Rooms.create(), formData)
        .then(({ roomId }) => console.log("Created room w/ ID:", roomId))
        .then(() => caches.open(SECTION_ROOM_FORM_CACHE_PATH))
        .then((cache) => cache.delete(internalCacheUrl))
        .catch((e) => notify(e, "error"));
    }
  }

  /**
   * @param {React.FormEvent<HTMLFormElement>} e
   * @returns {void}
   */
  function handleSubmitSync(e) {
    e.preventDefault(); // <-- this HAS to be synchronously or else the form will submit before the cache is updated

    if (viewOnly) {
      notify(
        lang("This form is view only", "এই ফর্মটি শুধুমাত্র দেখার জন্য", "यह फॉर्म केवल देखने के लिए है"),
        "error"
      );
      return;
    }

    setActiveButtonKind("loading");
    handleSubmitAsync(e)
      .then(() => setActiveButtonKind("not-loading"))
      .catch((e) => {
        notify(e, "error");
        setActiveButtonKind("not-loading");
      });
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
            disabled={viewOnly}
            placeholder={lang("Set Search Tags", "সার্চ ট্যাগ সেট করুন", "सर्च टैग सेट करें")}
            pillsSet={searchTagsSet}
            setPillsSet={setSearchTagsSet}
          />
          <PillsInput
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
              placeholder={lang("Price Per Occupant", "প্রতি বাসিন্দার দাম", "प्रति व्यक्ति कीमत")}
              name="pricePerOccupant"
            />
          </div>
        </div>

        <div className="filedit-container">{/* TODO: Add multi-file input */}</div>
      </div>

      {mode !== "READ" && (
        <div className="submit-container">
          <ButtonText
            disabled={viewOnly}
            name="save-draft"
            title={lang("Save Draft", "ড্রাফ্ট সংরক্ষণ করুন", "ड्राफ्ट सेव करें")}
            rounded="all"
            width="50%"
            kind={draftButtonKind}
            onClick={() => setSubmitAction("save-draft")}
          />
          <ButtonText
            disabled={viewOnly}
            name="submit"
            title={
              mode === "DELETE"
                ? lang("Delete", "ডিলিট", "डिलीट")
                : mode === "UPDATE"
                ? lang("Update", "আপডেট", "अपडेट")
                : lang("New Room", "নতুন রুম", "नया रूम")
            }
            rounded="all"
            width="50%"
            kind={submitButtonKind}
            bgColor={mode === "DELETE" ? "red" : void 0}
            onClick={() =>
              setSubmitAction(
                mode === "DELETE" ? "submit-delete" : mode === "UPDATE" ? "submit-update" : "submit-create"
              )
            }
          />
        </div>
      )}

      <i className="btn-close fa fa-close" onClick={() => dialog.hide()} />
    </form>
  );
}
