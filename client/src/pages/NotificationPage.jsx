import { useEffect, useState } from "react";
import axios from "axios";

import {
  Bell,
  ArrowLeft,
  CalendarDays,
  ShoppingBag,
  Package,
  RefreshCw,
  ChevronRight,
} from "lucide-react";

/* =====================================================
   API
===================================================== */

const API_URL = "http://10.42.240.226:5000/api";

/* =====================================================
   LOCAL STORAGE
===================================================== */

const READ_NOTIFICATIONS_KEY =
  "om_sai_read_notifications";

/* =====================================================
   READ IDS
===================================================== */

function getReadNotificationIds() {
  try {
    const saved =
      localStorage.getItem(
        READ_NOTIFICATIONS_KEY
      );

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    return Array.isArray(parsed)
      ? parsed.map(String)
      : [];
  } catch (error) {
    console.error(
      "Read notification error:",
      error
    );

    return [];
  }
}

/* =====================================================
   SAVE READ IDS
===================================================== */

function saveReadNotificationIds(ids) {
  try {
    localStorage.setItem(
      READ_NOTIFICATIONS_KEY,
      JSON.stringify(
        [...new Set(ids.map(String))]
      )
    );
  } catch (error) {
    console.error(
      "Save read notification error:",
      error
    );
  }
}

/* =====================================================
   NOTIFICATION PAGE
===================================================== */

function NotificationPage() {
  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [materials, setMaterials] =
    useState([]);

  const [refreshing, setRefreshing] =
    useState(false);

  const [unreadCount, setUnreadCount] =
    useState(0);

  /* ===================================================
     BUILD NOTIFICATIONS
  =================================================== */

  const buildNotifications = (
    bookingData,
    notificationData,
    materialData
  ) => {
    const result = [];

    const bookings =
      Array.isArray(
        bookingData?.bookings
      )
        ? bookingData.bookings
        : [];

    const backendNotifications =
      Array.isArray(
        notificationData?.notifications
      )
        ? notificationData.notifications
        : [];

    /* =================================================
       BACKEND NOTIFICATIONS
    ================================================= */

    backendNotifications.forEach(
      (notification) => {
        result.push({
          id: String(
            notification.id
          ),

          type:
            notification.type ||
            "GENERAL",

          title:
            notification.title ||
            "सूचना",

          message:
            notification.message ||
            "",

          icon:
            CalendarDays,

          iconClass:
            "bg-orange-100 text-orange-600",

          date:
            notification.createdAt ||
            notification.date ||
            new Date().toISOString(),

          bookingId:
            notification.bookingId ||
            null,
        });
      }
    );

    /* =================================================
       NEW BOOKINGS
    ================================================= */

    bookings
      .slice(0, 5)
      .forEach((booking) => {
        result.push({
          id:
            `booking-${booking.id}`,

          type:
            "NEW_BOOKING",

          title:
            "नवीन बुकिंग",

          message:
            `${
              booking.customer?.name ||
              "ग्राहक"
            } यांची नवीन बुकिंग आली आहे.`,

          icon:
            ShoppingBag,

          iconClass:
            "bg-emerald-100 text-emerald-600",

          date:
            booking.createdAt ||
            booking.bookingDate,

          bookingDate:
            booking.bookingDate,

          eventDate:
            booking.eventDate,

          bookingId:
            booking.id,
        });
      });

    /* =================================================
       UPCOMING EVENTS
    ================================================= */

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    bookings.forEach(
      (booking) => {
        if (!booking.eventDate) {
          return;
        }

        const eventDate =
          new Date(
            booking.eventDate
          );

        if (
          Number.isNaN(
            eventDate.getTime()
          )
        ) {
          return;
        }

        eventDate.setHours(
          0,
          0,
          0,
          0
        );

        const difference =
          eventDate.getTime() -
          today.getTime();

        const daysRemaining =
          Math.ceil(
            difference /
              (1000 * 60 * 60 * 24)
          );

        if (
          daysRemaining < 0 ||
          daysRemaining > 2
        ) {
          return;
        }

        let title =
          "";

        let message =
          "";

        let iconClass =
          "bg-orange-100 text-orange-600";

        if (
          daysRemaining === 0
        ) {
          title =
            "आजचा कार्यक्रम";

          message =
            `${
              booking.customer?.name ||
              "ग्राहक"
            } यांचा कार्यक्रम आज आहे.`;

          iconClass =
            "bg-red-100 text-red-600";
        } else if (
          daysRemaining === 1
        ) {
          title =
            "उद्याचा कार्यक्रम";

          message =
            `${
              booking.customer?.name ||
              "ग्राहक"
            } यांचा कार्यक्रम उद्या आहे.`;
        } else {
          title =
            "परवाचा कार्यक्रम";

          message =
            `${
              booking.customer?.name ||
              "ग्राहक"
            } यांचा कार्यक्रम परवा आहे.`;
        }

        result.push({
          id:
            `upcoming-${booking.id}-${daysRemaining}`,

          type:
            "UPCOMING",

          title,

          message,

          icon:
            CalendarDays,

          iconClass,

          date:
            booking.eventDate,

          bookingDate:
            booking.bookingDate,

          eventDate:
            booking.eventDate,

          bookingId:
            booking.id,
        });
      }
    );

    /* =================================================
       OUT OF STOCK MATERIALS
       Same notification IDs used by Dashboard:
       stock-${material.id}
    ================================================= */

    const materials =
      Array.isArray(materialData?.materials)
        ? materialData.materials
        : [];

    materials
      .filter(
        (material) =>
          Number(material.stock || 0) === 0
      )
      .forEach((material) => {
        result.push({
          id: `stock-${material.id}`,
          type: "STOCK",
          title: "साहित्य स्टॉक नाही",
          message: `${material.name || "साहित्य"} सध्या उपलब्ध नाही.`,
          icon: Package,
          iconClass:
            "bg-red-100 text-red-600",
          date:
            material.updatedAt ||
            material.createdAt ||
            new Date().toISOString(),
          bookingId: null,
        });
      });

    /* =================================================
       UNIQUE
    ================================================= */

    return [
      ...new Map(
        result.map(
          (notification) => [
            String(
              notification.id
            ),
            notification,
          ]
        )
      ).values(),
    ].sort(
      (a, b) =>
        new Date(
          b.date || 0
        ) -
        new Date(
          a.date || 0
        )
    );
  };

  /* ===================================================
     FETCH
  =================================================== */

  const fetchNotifications = async (
    showRefresh = false,
    markCurrentAsRead = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [
        notificationResponse,
        bookingResponse,
        materialResponse,
      ] = await Promise.all([
        axios.get(
          `${API_URL}/bookings/notifications`
        ),

        axios.get(
          `${API_URL}/bookings`
        ),

        axios.get(
          `${API_URL}/materials`
        ),
      ]);

      const materialData =
        materialResponse.data || {};

      setMaterials(
        materialData.materials || []
      );

      const result =
        buildNotifications(
          bookingResponse.data,
          notificationResponse.data,
          materialData
        );

      setNotifications(
        result
      );

      /* ===============================================
         CURRENT UNREAD
      =============================================== */

      const readIds =
        getReadNotificationIds();

      let unread =
        result.filter(
          (notification) =>
            !readIds.includes(
              String(
                notification.id
              )
            )
        );

      /* ===============================================
         PAGE OPENED:
         CURRENT notifications read
      =============================================== */

      if (
        markCurrentAsRead &&
        result.length > 0
      ) {
        const currentIds =
          result.map(
            (notification) =>
              String(
                notification.id
              )
          );

        saveReadNotificationIds([
          ...readIds,
          ...currentIds,
        ]);

        unread = [];
      }

      setUnreadCount(
        unread.length
      );
    } catch (error) {
      console.error(
        "Notification fetch error:",
        error
      );

      if (!showRefresh) {
        alert(
          error.response?.data
            ?.message ||
            "सूचना मिळवताना त्रुटी आली."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ===================================================
     PAGE OPEN
     
     IMPORTANT:
     पहिल्यांदा page उघडल्यावर
     current notifications read.
  =================================================== */

  useEffect(() => {
    fetchNotifications(
      false,
      true
    );

    /*
      नंतर auto refresh करताना
      नवीन notifications unread राहतील.
    */

    const interval =
      setInterval(() => {
        fetchNotifications(
          true,
          false
        );
      }, 30000);

    return () => {
      clearInterval(
        interval
      );
    };
  }, []);

  /* ===================================================
     OPEN NOTIFICATION
  =================================================== */

  const openNotification = (
    notification
  ) => {
    const id = String(
      notification.id
    );

    const readIds =
      getReadNotificationIds();

    if (
      !readIds.includes(id)
    ) {
      saveReadNotificationIds([
        ...readIds,
        id,
      ]);

      setUnreadCount(
        (count) =>
          Math.max(
            count - 1,
            0
          )
      );
    }

    if (
      notification.bookingId
    ) {
      window.location.href =
        `/bookings/${notification.bookingId}`;
    }
  };

  /* ===================================================
     BACK
  =================================================== */

  const goBack = () => {
    window.location.href =
      "/dashboard";
  };

  /* ===================================================
     LOADING
  =================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb]">

        <div className="text-center">

          <RefreshCw
            size={28}
            className="mx-auto animate-spin text-slate-400"
          />

          <p className="mt-2 text-xs text-slate-500">
            सूचना लोड होत आहेत...
          </p>

        </div>

      </div>
    );
  }

  /* ===================================================
     UI
  =================================================== */

  return (
    <div className="min-h-screen bg-[#f6f7fb] pb-8">

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-3 sm:px-4">

          <div className="flex min-w-0 items-center gap-2.5">

            <button
              type="button"
              onClick={
                goBack
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
            >
              <ArrowLeft
                size={18}
              />
            </button>

            <div className="min-w-0">

              <p className="truncate text-[9px] font-bold tracking-[0.12em] text-slate-400">
                OM SAI CETERS
              </p>

              <h1 className="truncate text-sm font-black text-slate-900">
                सूचना
              </h1>

            </div>

          </div>

          <div className="flex items-center gap-1.5">

            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-1 text-[9px] font-black text-white">
                {unreadCount}
              </span>
            )}

            <button
              type="button"
              onClick={() =>
                fetchNotifications(
                  true,
                  false
                )
              }
              disabled={
                refreshing
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 disabled:opacity-60"
            >
              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </button>

            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">

              <Bell size={17} />

              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-black text-white">
                  {unreadCount}
                </span>
              )}

            </div>

          </div>

        </div>

      </header>
            {/* =================================================
          CONTENT
      ================================================= */}

      <main className="mx-auto max-w-3xl px-3 py-3 sm:px-4 sm:py-4">

        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="mb-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">

          <div className="flex items-center justify-between gap-2">

            <div className="flex min-w-0 items-center gap-2">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Bell size={16} />
              </div>

              <div className="min-w-0">

                <h2 className="truncate text-xs font-black text-slate-900 sm:text-sm">
                  नवीन सूचना
                </h2>

                <p className="mt-0.5 truncate text-[9px] text-slate-400">
                  बुकिंग आणि कार्यक्रमाच्या सूचना
                </p>

              </div>

            </div>

            {unreadCount > 0 ? (
              <span className="shrink-0 rounded-full bg-red-50 px-2 py-1 text-[9px] font-black text-red-600">
                नवीन {unreadCount}
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-700">
                नवीन सूचना नाही
              </span>
            )}

          </div>

        </section>

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {notifications.length === 0 ? (

          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">

            <Bell
              size={30}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-black text-slate-700">
              कोणतीही सूचना नाही
            </p>

            <p className="mt-1 text-xs text-slate-400">
              नवीन बुकिंग किंवा कार्यक्रमाची
              सूचना येथे दिसेल.
            </p>

          </div>

        ) : (

          <div className="space-y-2">

            {/* =================================================
                NOTIFICATION LIST
            ================================================= */}

            {notifications.map(
              (notification) => {

                const Icon =
                  notification.icon;

                const readIds =
                  getReadNotificationIds();

                const isRead =
                  readIds.includes(
                    String(
                      notification.id
                    )
                  );

                return (
                  <button
                    key={
                      notification.id
                    }
                    type="button"
                    onClick={() =>
                      openNotification(
                        notification
                      )
                    }
                    className={`block w-full rounded-xl border text-left transition active:scale-[0.995] ${
                      isRead
                        ? "border-slate-200 bg-white"
                        : "border-blue-200 bg-blue-50/50"
                    }`}
                  >

                    <div className="px-3 py-2.5">

                      <div className="flex items-start gap-2.5">

                        {/* =================================
                            ICON
                        ================================= */}

                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${notification.iconClass}`}
                        >
                          <Icon size={16} />
                        </div>

                        {/* =================================
                            CONTENT
                        ================================= */}

                        <div className="min-w-0 flex-1">

                          <div className="flex items-start justify-between gap-2">

                            <div className="flex min-w-0 items-center gap-1.5">

                              <h3 className="truncate text-xs font-black text-slate-900">
                                {
                                  notification.title
                                }
                              </h3>

                              {!isRead && (
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                              )}

                            </div>

                            <span className="shrink-0 text-[8px] font-semibold text-slate-400">
                              {formatNotificationDate(
                                notification.date
                              )}
                            </span>

                          </div>

                          <p className="mt-0.5 text-[10px] leading-4 text-slate-600">
                            {
                              notification.message
                            }
                          </p>

                          {/* =================================
                              BOOKING DETAILS
                          ================================= */}

                          {notification.type ===
                            "NEW_BOOKING" && (

                            <div className="mt-1.5 flex flex-wrap gap-1.5">

                              <InfoBadge
                                label="बुकिंग"
                                value={
                                  formatNotificationDate(
                                    notification.bookingDate
                                  )
                                }
                              />

                              <InfoBadge
                                label="कार्यक्रम"
                                value={
                                  formatNotificationDate(
                                    notification.eventDate
                                  )
                                }
                              />

                            </div>
                          )}

                          {/* =================================
                              UPCOMING DETAILS
                          ================================= */}

                          {notification.type ===
                            "UPCOMING" && (

                            <div className="mt-1.5">

                              <InfoBadge
                                label="कार्यक्रम"
                                value={
                                  formatNotificationDate(
                                    notification.eventDate
                                  )
                                }
                              />

                            </div>
                          )}

                          {notification.type ===
                            "STOCK" && (

                            <div className="mt-1.5">
                              <InfoBadge
                                label="स्थिती"
                                value="स्टॉक नाही"
                              />
                            </div>
                          )}

                        </div>

                        {/* =================================
                            ARROW
                        ================================= */}

                        {notification.bookingId ? (
                          <div className="shrink-0 pt-1 text-slate-300">
                            <ChevronRight
                              size={15}
                            />
                          </div>
                        ) : null}

                      </div>

                    </div>

                  </button>
                );
              }
            )}

          </div>

        )}

      </main>

    </div>
  );
}

/* =====================================================
   INFO BADGE
===================================================== */

function InfoBadge({
  label,
  value,
}) {
  return (
    <span className="rounded-md bg-slate-100 px-1.5 py-1 text-[8px] text-slate-500">

      <b className="text-slate-700">
        {label}:
      </b>{" "}

      {value || "-"}

    </span>
  );
}

/* =====================================================
   DATE FORMAT
===================================================== */

function formatNotificationDate(
  date
) {
  if (!date) {
    return "-";
  }

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return "-";
  }

  return parsed.toLocaleDateString(
    "mr-IN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}
/* =====================================================
   NOTIFICATION HELPERS
===================================================== */

/*
  एखादी notification read आहे का?
*/

function isNotificationRead(
  notificationId
) {
  const readIds =
    getReadNotificationIds();

  return readIds.includes(
    String(notificationId)
  );
}

/*
  एक notification read करा.
*/

function markNotificationRead(
  notificationId
) {
  const id =
    String(notificationId);

  const readIds =
    getReadNotificationIds();

  if (
    readIds.includes(id)
  ) {
    return;
  }

  saveReadNotificationIds([
    ...readIds,
    id,
  ]);
}

/*
  अनेक notifications read करा.
*/

function markNotificationsRead(
  notificationIds
) {
  const readIds =
    getReadNotificationIds();

  const ids =
    Array.isArray(
      notificationIds
    )
      ? notificationIds.map(
          (id) => String(id)
        )
      : [];

  saveReadNotificationIds([
    ...readIds,
    ...ids,
  ]);
}

/* =====================================================
   CLEAN OLD READ IDS
===================================================== */

function cleanupReadIds(
  notifications
) {
  const currentIds =
    new Set(
      (notifications || []).map(
        (notification) =>
          String(
            notification.id
          )
      )
    );

  const oldReadIds =
    getReadNotificationIds();

  const cleanedIds =
    oldReadIds.filter(
      (id) =>
        currentIds.has(
          String(id)
        )
    );

  saveReadNotificationIds(
    cleanedIds
  );
}

/* =====================================================
   EXPORT
===================================================== */

export default NotificationPage;