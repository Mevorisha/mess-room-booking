import React, { useState, useCallback, useEffect } from "react";
import ButtonText from "@/components/ButtonText";
import useDialogBox from "@/hooks/dialogbox";
import { CachePaths } from "@/modules/util/caching";
import { base64FileDataToFile } from "@/modules/util/dataConversion";
import { lang } from "@/modules/util/language";
import SectionRoomCreateForm from "@/pages/unparameterized/OwnerRooms/SectionRoomCreateForm";
import useNotification from "@/hooks/notification";
import ConfirmDialog from "@/components/ConfirmDialog";
import { urlObjectCreateWrapper, urlObjectRevokeWrapper } from "@/modules/util/trackedFunctions";

/**
 * @typedef {Object} DraftData
 * @property {string} url,
 * @property {string} landmark
 * @property {string[]} searchTags
 * @property {string[]} majorTags
 * @property {string} city
 * @property {string} state
 * @property {string} firstImage
 */

/**
 * @param {{ handleAddNewRoom: () => void }} props
 * @returns {React.JSX.Element}
 */
export default function SectionDrafts({ handleAddNewRoom }) {
  const notify = useNotification();
  const dialog = useDialogBox();

  const [drafts, setDrafts] = useState(/**@type {Record<string, DraftData>}*/ ({}));
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);

  async function loadDrafts() {
    /**
     * @param {Cache} cache
     * @param {string} url
     * @returns {Promise<DraftData|null>}
     */
    async function loadFromCacheByUrl(cache, url) {
      // Skip the last-id entry
      if (url.endsWith("/last-id")) return null;
      const response = await cache.match(url);

      /** @type {import("@/pages/unparameterized/OwnerRooms/SectionRoomCreateForm").CachableDraftFormData} */
      const data = await response.json();

      // Extract the first image if available
      let firstImage = /** @type {string | null} */ (null);
      if (data.files && data.files.length > 0) {
        firstImage = urlObjectCreateWrapper(base64FileDataToFile(data.files[0]));
      }

      return {
        url,
        landmark: data.landmark || "",
        searchTags: data.searchTags || [],
        majorTags: data.majorTags || [],
        city: data.city || "",
        state: data.state || "",
        firstImage,
      };
    }

    try {
      setIsLoadingDrafts(true);
      const cache = await caches.open(CachePaths.SECTION_ROOM_FORM);
      // all cache keys
      const allDraftCacheUrls = new Set((await cache.keys()).map((req) => req.url));
      // create promises to load the drafts concurrently
      const newLoadedDrafts = await (async () => {
        const draftUrlsToBeLoaded = Array.from(allDraftCacheUrls).filter((url) => !drafts[url]);
        const draftUrlsToBeLoadedPromises = draftUrlsToBeLoaded.map((url) => loadFromCacheByUrl(cache, url));
        const loadedDrafts = await Promise.all(draftUrlsToBeLoadedPromises);
        return loadedDrafts.reduce((acc, dr) => {
          if (!dr) return acc;
          acc[dr.url] = dr;
          return acc;
        }, /** @type {Record<string, DraftData>} */ ({}));
      })();
      // find out drafts are in memory but no more in cache
      const draftUrlsToBeRevoked = Object.keys(drafts).filter((url) => !allDraftCacheUrls.has(url));
      // set drafts and revoke deleted draft firstImage urls
      setDrafts((oldDrafts) => {
        const keepDrafts = { ...oldDrafts };
        draftUrlsToBeRevoked.forEach((url) => {
          if (!url) return;
          if (!keepDrafts[url].firstImage) return;
          urlObjectRevokeWrapper(keepDrafts[url].firstImage);
          delete keepDrafts[url];
        });
        return { ...keepDrafts, ...newLoadedDrafts };
      });
    } catch (error) {
      console.error(error);
      notify(
        lang("Error loading drafts", "ড্রাফট লোড করতে সমস্যা হয়েছে", "ड्राफ्ट लोड करने में त्रुटि हुई है"),
        "error"
      );
    } finally {
      // This timeout reduces flicker by giving user time to adjust to the new UI before popuating it
      setTimeout(() => setIsLoadingDrafts(false), 2000);
    }
  }

  /**
   * @param {string} draftUrl
   */
  function handleOpenDraft(draftUrl) {
    dialog.show(<SectionRoomCreateForm draftCacheUrl={draftUrl} />, "uibox");
  }

  /**
   * @param {string} draftUrl
   */
  function handleDeleteDraft(draftUrl) {
    caches
      .open(CachePaths.SECTION_ROOM_FORM)
      .then((cache) => cache.delete(draftUrl))
      .then(() => loadDrafts())
      .catch((e) => notify(e, "error"));
  }

  // on mount
  useEffect(
    () => {
      loadDrafts();
      return () =>
        Object.values(drafts).forEach((it) => {
          if (it.firstImage) urlObjectRevokeWrapper(it.firstImage);
          it.firstImage = "";
        });
    },
    // on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="section-container">
      <div className="section-header">
        <h2>{lang("Drafts", "খসড়া", "ड्राफ्ट")}</h2>
        <button className="reload-button" onClick={loadDrafts} disabled={isLoadingDrafts}>
          <i className="fa fa-refresh" aria-hidden="true"></i>
        </button>
      </div>

      {isLoadingDrafts ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : Object.keys(drafts).length > 0 ? (
        <ul className="content-list">
          {Object.values(drafts).map((draft, index) => (
            <li key={index} className="content-item item-item">
              <div className="item-preview">
                {draft.firstImage && (
                  <div className="item-image">
                    <img src={draft.firstImage} alt={draft.landmark} />
                  </div>
                )}
                <div className="item-info">
                  <div className="item-landmark" title={draft.landmark}>
                    {draft.landmark}
                  </div>
                  <div className="item-location">
                    {draft.city}, {draft.state}
                  </div>
                  <div className="item-tags">
                    {/* Show only 2 search tags and 1 major tag */}
                    {draft.searchTags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="tag search-tag">
                        {tag}
                      </span>
                    ))}
                    {draft.majorTags.slice(0, 1).map((tag, idx) => (
                      <span key={idx} className="tag major-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="item-actions">
                  <button
                    className="edit-item-button"
                    onClick={() => handleOpenDraft(draft.url)}
                    title={lang("Edit", "এডিট করুন", "एडिट करें")}
                  >
                    <i className="fa fa-pencil" aria-hidden="true"></i>
                  </button>
                  <button
                    className="delete-item-button"
                    onClick={() =>
                      dialog.show(
                        <ConfirmDialog
                          title={lang(
                            "Confirm Delete Draft",
                            "ড্রাফট মুছে ফেলতে নিশ্চিত করুন",
                            "ड्राफ्ट हटाने के लिए कन्फर्म करें"
                          )}
                          text={lang(
                            "Click confirm to delete draft. This action cannot be undone and your data will be deleted.",
                            "ড্রাফট মুছে ফেলতে কনফার্ম চাপুন। এই কাজটি বাতিল করা যাবে না এবং আপনার ডেটা মুছে যাবে।",
                            "ड्राफ्ट हटाने के लिए कन्फर्म पर क्लिक करें। यह क्रिया पूर्ववत नहीं की जा सकती और आपका डेटा हट जाएगा।"
                          )}
                          onConfirm={() => handleDeleteDraft(draft.url)}
                        />
                      )
                    }
                    title={lang("Delete", "মুছে ফেলুন", "हटाएं")}
                  >
                    <i className="fa fa-trash" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-item-message">
          <p>{lang("No drafts found", "কোন খসড়া পাওয়া যায়নি", "कोई ड्राफ्ट नहीं मिला")}</p>
          <ButtonText
            width="50%"
            rounded="all"
            title={lang("Add Room", "রুম যোগ করুন", "रूम जोड़ें")}
            kind="secondary"
            onClick={handleAddNewRoom}
          />
        </div>
      )}
    </div>
  );
}
