import React, { useEffect } from "react";
import ButtonText from "@/components/ButtonText";
import useDialogBox, { DialogBoxHookType } from "@/hooks/dialogbox";
import { getLangCode, lang } from "@/modules/util/language";
import useNotification from "@/hooks/notification";
import ImageLoader from "@/components/ImageLoader";
import SectionRoomUpdateForm from "@/pages/unparameterized/OwnerRooms/SectionRoomUpdateForm";
import { apiGetOrDelete, ApiPaths, apiPostOrPatchJson } from "@/modules/util/api";
import ConfirmDialog from "@/components/ConfirmDialog";
import PagingContainer from "@/components/PagingContainer";
import { RoomData } from "@/modules/networkTypes/Room";

import "./styles.css";

export interface RatingDisplayProps {
  rating: number;
  washout?: string;
}

function RatingDisplay({ rating, washout }: RatingDisplayProps): React.ReactNode {
  // if (rating === 0) return <></>;
  return (
    <div className={`item-rating ${washout}`} title={rating.toString()}>
      <i className="fa fa-star-o"></i>
      <span>{rating}</span>
    </div>
  );
}

export interface RestoreOrDeleteProps {
  dialog: DialogBoxHookType;
  roomItem: RoomData;
  handleRestoreRoom: (roomId: string) => void;
  handleDeleteRoom: (roomId: string, force?: boolean) => void;
}

function RestoreOrDelete({
  dialog,
  roomItem,
  handleRestoreRoom,
  handleDeleteRoom,
}: RestoreOrDeleteProps): React.ReactNode {
  if (!(roomItem.isDeleted ?? false)) {
    return (
      <button
        className="delete-item-button"
        onClick={() =>
          dialog.show(
            <ConfirmDialog
              title={lang("Confirm Delete Room", "রুম মুছে ফেলতে নিশ্চিত করুন", "रूम हटाने के लिए कन्फर्म करें")}
              text={lang(
                "Click confirm to delete room. Deleted rooms can be restored within 30 days, after which they will be permanently removed.",
                "রুম মুছে ফেলতে কনফার্ম চাপুন। মুছে ফেলা রুমগুলি ৩০ দিনের মধ্যে পুনরুদ্ধার করা যাবে, তারপর সেগুলি স্থায়ীভাবে সরানো হবে।",
                "रूम हटाने के लिए कन्फर्म पर क्लिक करें। हटाए गए रूम 30 दिनों के भीतर रीस्टोर किए जा सकते हैं, उसके बाद वे स्थायी रूप से हटा दिए जाएंगे।"
              )}
              onConfirm={() => handleDeleteRoom(roomItem.id ?? "unknown")}
            />
          )
        }
        title={lang("Delete", "মুছে ফেলুন", "हटाएं")}
      >
        <i className="fa fa-trash" aria-hidden="true"></i>
      </button>
    );
  } else {
    return (
      <>
        <button
          className="restore-item-button"
          onClick={() =>
            dialog.show(
              <ConfirmDialog
                title={lang(
                  "Confirm Restore Room",
                  "রুম পুনরুদ্ধার করতে নিশ্চিত করুন",
                  "रूम रीस्टोर करने के लिए कन्फर्म करें"
                )}
                text={lang(
                  "Click confirm to restore room. Your room data will be recovered.",
                  "রুম পুনরুদ্ধার করতে কনফার্ম চাপুন। আপনার রুম ডেটা পুনরুদ্ধার করা হবে।",
                  "रूम रीस्टोर करने के लिए कन्फर्म पर क्लिक करें। आपका रूम डेटा वापस मिल जाएगा।"
                )}
                onConfirm={() => handleRestoreRoom(roomItem.id ?? "unknown")}
              />
            )
          }
          title={lang("Restore", "পুনরুদ্ধার করুন", "रीस्टोर करें")}
        >
          <i className="fa fa-undo" aria-hidden="true"></i>
        </button>
        <button
          className="delete-item-button"
          onClick={() =>
            dialog.show(
              <ConfirmDialog
                title={lang(
                  "Confirm Permanent Deletion",
                  "স্থায়ী ভাবে মুছে ফেলতে নিশ্চিত করুন",
                  "स्थायी रूप से हटाने की पुष्टि करें"
                )}
                text={lang(
                  "WARNING: This will permanently delete the room immediately. This action CANNOT be undone and all data will be lost forever.",
                  "সতর্কতা: এটি অবিলম্বে রুমটি স্থায়ীভাবে মুছে ফেলবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না এবং সমস্ত ডেটা চিরতরে হারিয়ে যাবে।",
                  "चेतावनी: यह रूम को तुरंत स्थायी रूप से हटा देगा। यह कार्रवाई पूर्ववत नहीं की जा सकती है और सभी डेटा हमेशा के लिए खो जाएगा।"
                )}
                onConfirm={() => handleDeleteRoom(roomItem.id ?? "unknown", true)}
              />
            )
          }
          title={lang("Permanently Delete", "স্থায়ীভাবে মুছুন", "स्थायी रूप से हटाएं")}
        >
          <i className="fa fa-exclamation-triangle" aria-hidden="true"></i>
        </button>
      </>
    );
  }
}

export interface SectionRoomsProps {
  handleAddNewRoom: () => void;
  reloadDraft: () => Promise<void>;
  reloadApi: (params?: { page?: number; invalidateCache?: boolean }) => Promise<void>;
  isLoadingDrafts: boolean;
  isLoadingRooms: boolean;
  rooms: RoomData[];
  roomPages: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export default function SectionRooms({
  handleAddNewRoom,
  reloadDraft: _,
  reloadApi,
  isLoadingDrafts: _1,
  isLoadingRooms,
  rooms,
  roomPages,
  currentPage,
  setCurrentPage,
}: SectionRoomsProps): React.ReactNode {
  const notify = useNotification();
  const dialog = useDialogBox();

  function handlePageChange(n: number): void {
    reloadApi({ page: n }).catch((e: Error) => notify(e, "error"));
  }

  function handleOpenRoom(roomData: RoomData): void {
    dialog.show(<SectionRoomUpdateForm roomData={roomData} reloadApi={reloadApi} />, "uibox");
  }

  function handleDeleteRoom(roomId: string, force?: boolean): void {
    apiGetOrDelete("DELETE", ApiPaths.Rooms.delete(roomId, force))
      .then(() => notify(lang("Room deleted", "রুম মুছে ফেলা হয়েছে", "कमरा हटा दिया गया है"), "success"))
      .then(() => reloadApi({ invalidateCache: true }))
      .catch((e: Error) => notify(e, "error"));
  }

  function handleRestoreRoom(roomId: string): void {
    apiPostOrPatchJson("PATCH", ApiPaths.Rooms.restore(roomId), {})
      .then(() => notify(lang("Room restored", "রুম পুনরুদ্ধার করা হয়েছে", "रुम रीस्टोर किया गया है"), "success"))
      .then(() => reloadApi({ invalidateCache: true }))
      .catch((e: Error) => notify(e, "error"));
  }

  useEffect(() => {
    reloadApi({ invalidateCache: true }).catch((e: Error) => notify(e, "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notify]);

  return (
    <div className="section-RoomList">
      <div className="section-header">
        <h2>{lang("Rooms", "রুম", "रूम")}</h2>
        <button
          className="reload-button"
          onClick={() => void reloadApi({ invalidateCache: true })}
          disabled={isLoadingRooms}
        >
          <i className="fa fa-refresh" aria-hidden="true"></i>
        </button>
      </div>

      {isLoadingRooms ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : rooms.length > 0 ? (
        <>
          <ul className="content-list">
            {rooms.map((roomItem, index) => {
              const washout = (roomItem.isDeleted ?? false) || roomItem.isUnavailable ? "washout" : "";
              return (
                <li key={index} className="content-item">
                  <div className="item-preview">
                    {roomItem.images.length > 0 && (
                      <div className={`item-image ${washout}`}>
                        <ImageLoader src={roomItem.images[0]?.medium ?? ""} alt={roomItem.landmark} />
                      </div>
                    )}
                    <div className="item-preview-nonimg">
                      <div className="item-info">
                        <div className={`item-landmark ${washout}`} title={roomItem.landmark}>
                          {roomItem.landmark}
                        </div>
                        <div className={`item-location ${washout}`}>
                          {roomItem.city}, {roomItem.state}
                        </div>
                        <div className="item-tags">
                          {/* Show only 2 search tags and 1 major tag */}
                          {!roomItem.isUnavailable &&
                            !(roomItem.isDeleted ?? false) &&
                            roomItem.searchTags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} title={tag} className="tag search-tag">
                                {tag}
                              </span>
                            ))}
                          {!roomItem.isUnavailable &&
                            !(roomItem.isDeleted ?? false) &&
                            roomItem.majorTags.slice(0, 1).map((tag, idx) => (
                              <span key={idx} title={tag} className="tag major-tag">
                                {tag}
                              </span>
                            ))}
                          {!(roomItem.isDeleted ?? false) && roomItem.isUnavailable && (
                            <span className="tag hidden-tag">{lang("Unavalilable", "অনুপলব্ধ", "उपलब्ध नहीं है")}</span>
                          )}
                          {(roomItem.isDeleted ?? false) && (
                            <span className="tag deleted-tag">
                              {roomItem.ttl != null
                                ? lang(
                                    `Delete on ${new Date(roomItem.ttl).toLocaleString(getLangCode(), {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}`,
                                    `${new Date(roomItem.ttl).toLocaleString(getLangCode(), {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })} তারিখে মোছা হবে`,
                                    `${new Date(roomItem.ttl).toLocaleString(getLangCode(), {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })} को मिटाया जायेगा`
                                  )
                                : lang("Deleted", "মুছে ফেলা", "हटाया गया")}
                            </span>
                          )}
                        </div>
                        <div className="item-price">
                          <span className="price-amount">₹{roomItem.pricePerOccupant}</span>
                          <span className="price-period">{" " + lang("per head", "প্রতি জনে", "प्रति व्यक्ति")}</span>
                        </div>
                      </div>
                      <div className="item-rating-actions">
                        <RatingDisplay rating={roomItem.rating} washout={washout} />
                        <div className="item-actions">
                          {!(roomItem.isDeleted ?? false) && (
                            <button
                              className="edit-item-button"
                              onClick={() => handleOpenRoom(roomItem)}
                              title={lang("Edit", "এডিট করুন", "एडिट करें")}
                            >
                              <i className="fa fa-pencil" aria-hidden="true"></i>
                            </button>
                          )}
                          <RestoreOrDelete
                            dialog={dialog}
                            roomItem={roomItem}
                            handleRestoreRoom={handleRestoreRoom}
                            handleDeleteRoom={handleDeleteRoom}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <PagingContainer
            totalPages={roomPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            onPageChange={(n) => handlePageChange(n)}
          />
        </>
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
