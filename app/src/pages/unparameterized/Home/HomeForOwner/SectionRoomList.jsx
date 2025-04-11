import React, { useState, useCallback, useEffect } from "react";
import ButtonText from "@/components/ButtonText";
import useDialogBox from "@/hooks/dialogbox";
import { lang } from "@/modules/util/language";
import useNotification from "@/hooks/notification";
import ImageLoader from "@/components/ImageLoader";
import SectionRoomUpdateForm from "../../OwnerRooms/SectionRoomUpdateForm";
import { apiGetOrDelete, ApiPaths } from "@/modules/util/api";
import ConfirmDialog from "@/components/ConfirmDialog";

/**
 * @param {{ handleAddNewRoom: () => void }} props
 * @returns {React.JSX.Element}
 */
export default function SectionRooms({ handleAddNewRoom }) {
  const notify = useNotification();
  const dialog = useDialogBox();

  const [rooms, setRooms] = useState(/** @type {import("../../OwnerRooms/SectionRoomUpdateForm").RoomData[]} */ ([]));
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  const loadRoomsFromAPI = useCallback(async () => {
    setIsLoadingRooms(true);
    const { json } = await apiGetOrDelete("GET", ApiPaths.Rooms.readListOnQuery({ self: true }));
    setRooms(json.rooms);
    setIsLoadingRooms(false);
  }, []);

  /**
   * @param {import("../../OwnerRooms/SectionRoomUpdateForm").RoomData} roomData
   */
  function handleOpenRoom(roomData) {
    dialog.show(<SectionRoomUpdateForm roomData={roomData} />, "uibox");
  }

  /**
   * @param {string} roomId
   */
  function handleDeleteRoom(roomId) {
    apiGetOrDelete("DELETE", ApiPaths.Rooms.delete(roomId))
      .then(() => notify(lang("Room deleted", "রুম মুছে ফেলা হয়েছে", "कमरा हटा दिया गया है"), "success"))
      .then(() => loadRoomsFromAPI())
      .catch((e) => notify(e, "error"));
  }

  useEffect(() => loadRoomsFromAPI().catch((e) => notify(e, "error")) && void 0, [loadRoomsFromAPI, notify]);

  return (
    <div className="section-container">
      <div className="section-header">
        <h2>{lang("Rooms", "রুম", "रूम")}</h2>
        <button className="reload-button" onClick={loadRoomsFromAPI} disabled={isLoadingRooms}>
          <i className="fa fa-refresh" aria-hidden="true"></i>
        </button>
      </div>

      {isLoadingRooms ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : rooms.length > 0 ? (
        <ul className="content-list">
          {rooms.map((roomItem, index) => (
            <li key={index} className="content-item item-item">
              <div className="item-preview">
                {roomItem.images?.length > 0 && (
                  <div className="item-image">
                    <ImageLoader src={roomItem.images[0].small} alt={roomItem.landmark} />
                  </div>
                )}
                <div className="item-info">
                  <div className="item-landmark" title={roomItem.landmark}>
                    {roomItem.landmark}
                  </div>
                  <div className="item-location">
                    {roomItem.city}, {roomItem.state}
                  </div>
                  <div className="item-tags">
                    {/* Show only 2 search tags and 1 major tag */}
                    {roomItem.searchTags.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="tag search-tag">
                        {tag}
                      </span>
                    ))}
                    {roomItem.majorTags.slice(0, 1).map((tag, idx) => (
                      <span key={idx} className="tag major-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="item-actions">
                  <button
                    className="edit-item-button"
                    onClick={() => handleOpenRoom(roomItem)}
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
                            "Confirm Delete Room",
                            "রুম মুছে ফেলতে নিশ্চিত করুন",
                            "रूम हटाने के लिए कन्फर्म करें"
                          )}
                          text={lang(
                            "Click confirm to delete room. This action cannot be undone and your data will be deleted.",
                            "রুম মুছে ফেলতে কনফার্ম চাপুন। এই কাজটি বাতিল করা যাবে না এবং আপনার ডেটা মুছে যাবে।",
                            "रूम हटाने के लिए कन्फर्म पर क्लिक करें। यह क्रिया पूर्ववत नहीं की जा सकती और आपका डेटा हट जाएगा।"
                          )}
                          onConfirm={() => handleDeleteRoom(roomItem.id)}
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
