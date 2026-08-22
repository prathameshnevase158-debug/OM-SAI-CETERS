import {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  CalendarDays,
  Package,
  IndianRupee,
  CheckCircle2,
  Clock3,
  Plus,
  History,
  RefreshCw,
  ArrowRight,
  Bell,
  AlertCircle,
} from "lucide-react";

/* =====================================================
   API
===================================================== */

const API_URL = "https://om-sai-ceters-server.onrender.com/api";

/* =====================================================
   NOTIFICATION STORAGE
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
   DAYS REMAINING
===================================================== */

function getDaysRemaining(
  eventDate
) {
  if (!eventDate) {
    return null;
  }

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const event =
    new Date(eventDate);

  if (
    Number.isNaN(
      event.getTime()
    )
  ) {
    return null;
  }

  event.setHours(
    0,
    0,
    0,
    0
  );

  return Math.ceil(
    (
      event.getTime() -
      today.getTime()
    ) /
      (1000 * 60 * 60 * 24)
  );
}

/* =====================================================
   DASHBOARD
===================================================== */

function Dashboard() {
  /* ===================================================
     DATA
  =================================================== */

  const [bookings, setBookings] =
    useState([]);

    const [currentAdmin, setCurrentAdmin] =
  useState(null);

useEffect(() => {
  try {
    const saved = localStorage.getItem(
      "om_sai_selected_admin"
    );

    if (saved) {
      setCurrentAdmin(
        JSON.parse(saved)
      );
    }
  } catch (error) {
    console.error(
      "Current admin read error:",
      error
    );
  }
}, []);

  const [materials, setMaterials] =
    useState([]);

  /* ===================================================
     NOTIFICATION
  =================================================== */

  const [notificationCount, setNotificationCount] =
    useState(0);

  /* ===================================================
     LOADING
  =================================================== */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  /* ===================================================
     BUILD NOTIFICATION IDS
  =================================================== */

  const buildNotificationIds = (
    fetchedBookings,
    fetchedMaterials
  ) => {
    const ids = [];

    /* नवीन bookings */

    fetchedBookings
      .slice(0, 5)
      .forEach(
        (booking) => {
          ids.push(
            `booking-${booking.id}`
          );
        }
      );

    /* Upcoming */

    fetchedBookings.forEach(
      (booking) => {
        const days =
          getDaysRemaining(
            booking.eventDate
          );

        if (
          days !== null &&
          days >= 0 &&
          days <= 2
        ) {
          ids.push(
            `upcoming-${booking.id}-${days}`
          );
        }
      }
    );

    /* Stock */

    fetchedMaterials
      .filter(
        (material) =>
          Number(
            material.stock || 0
          ) === 0
      )
      .forEach(
        (material) => {
          ids.push(
            `stock-${material.id}`
          );
        }
      );

    return [
      ...new Set(
        ids.map(String)
      ),
    ];
  };

  /* ===================================================
     UNREAD COUNT
  =================================================== */

  const calculateUnreadCount = (
    fetchedBookings,
    fetchedMaterials
  ) => {
    const ids =
      buildNotificationIds(
        fetchedBookings,
        fetchedMaterials
      );

    const readIds =
      getReadNotificationIds();

    const unread =
      ids.filter(
        (id) =>
          !readIds.includes(
            String(id)
          )
      );

    setNotificationCount(
      unread.length
    );
  };

  /* ===================================================
     FETCH DASHBOARD
  =================================================== */

  const fetchDashboardData =
    async (
      showRefresh = false
    ) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const [
          bookingsResponse,
          materialsResponse,
        ] = await Promise.all([
          axios.get(
            `${API_URL}/bookings`
          ),
          axios.get(
            `${API_URL}/materials`
          ),
        ]);

        const fetchedBookings =
          bookingsResponse.data
            ?.bookings || [];

        const fetchedMaterials =
          materialsResponse.data
            ?.materials || [];

        if (
          bookingsResponse.data
            ?.success
        ) {
          setBookings(
            fetchedBookings
          );
        }

        if (
          materialsResponse.data
            ?.success
        ) {
          setMaterials(
            fetchedMaterials
          );
        }

        calculateUnreadCount(
          fetchedBookings,
          fetchedMaterials
        );
      } catch (error) {
        console.error(
          "Dashboard fetch error:",
          error
        );

        if (!showRefresh) {
          alert(
            error.response?.data
              ?.message ||
              "Dashboard माहिती मिळवताना त्रुटी आली."
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  /* ===================================================
     FIRST LOAD
  =================================================== */

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /* ===================================================
     AUTO REFRESH
  =================================================== */

  useEffect(() => {
    const interval =
      setInterval(() => {
        fetchDashboardData(
          true
        );
      }, 30000);

    return () => {
      clearInterval(
        interval
      );
    };
  }, []);

  /* ===================================================
     NOTIFICATION STORAGE LISTENER
  =================================================== */

  useEffect(() => {
    const handleStorage =
      (event) => {
        if (
          event.key ===
          READ_NOTIFICATIONS_KEY
        ) {
          calculateUnreadCount(
            bookings,
            materials
          );
        }
      };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [
    bookings,
    materials,
  ]);

  /* ===================================================
     SUMMARY
  =================================================== */

  const summary =
    useMemo(() => {
      const totalBookings =
        bookings.length;

      const totalAmount =
        bookings.reduce(
          (sum, booking) =>
            sum +
            Number(
              booking.totalAmount || 0
            ),
          0
        );

      const received =
        bookings.reduce(
          (sum, booking) =>
            sum +
            Number(
              booking.advanceAmount || 0
            ),
          0
        );

      const remaining =
        bookings.reduce(
          (sum, booking) =>
            sum +
            Number(
              booking.remainingAmount || 0
            ),
          0
        );

      return {
        totalBookings,
        totalAmount,
        received,
        remaining,
      };
    }, [bookings]);

  /* ===================================================
     OUT OF STOCK
  =================================================== */

  const outOfStockMaterials =
    useMemo(() => {
      return materials.filter(
        (material) =>
          Number(
            material.stock || 0
          ) === 0
      );
    }, [materials]);

  /* ===================================================
     NAVIGATION
  =================================================== */

  const goTo = (
    path
  ) => {
    window.location.href =
      path;
  };

  /* ===================================================
     NOTIFICATION
  =================================================== */

  const openNotifications =
    () => {
      goTo(
        "/notifications"
      );
    };

  /* ===================================================
     LOADING
  =================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4">

        <div className="text-center">

          <RefreshCw
            size={30}
            className="mx-auto animate-spin text-slate-400"
          />

          <p className="mt-3 text-sm font-medium text-slate-500">
            Dashboard लोड होत आहे...
          </p>

        </div>

      </div>
    );
  }

  /* ===================================================
     MAIN UI
  =================================================== */

  return (
    <div className="min-h-screen bg-[#f6f7fb] pb-6">
          {/* =================================================
        HEADER
    ================================================= */}

    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">

      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-4">

       {/* ===============================================
    BRAND
=============================================== */}

<div className="min-w-0">

  <p className="text-[10px] font-bold tracking-[0.12em] text-slate-400">
    OM SAI CETERS
  </p>

  <div className="flex items-center gap-2">
    <h1 className="mt-0.5 text-base font-black text-slate-900 sm:text-lg">
      Dashboard
    </h1>

    {currentAdmin?.name && (
      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-700">
        {currentAdmin.name}
      </span>
    )}
  </div>

</div>

        {/* ===============================================
            HEADER ACTIONS
        =============================================== */}

        <div className="flex items-center gap-2">

          {/* NOTIFICATION */}

          <button
            type="button"
            onClick={openNotifications}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition active:scale-95"
            title="सूचना"
          >

            <Bell size={18} />

            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1.5 text-[10px] font-black leading-none text-white">
                {notificationCount > 99
                  ? "99+"
                  : notificationCount}
              </span>
            )}

          </button>

          {/* REFRESH */}

          <button
            type="button"
            onClick={() =>
              fetchDashboardData(true)
            }
            disabled={refreshing}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white transition active:scale-95 disabled:opacity-60"
          >

            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            <span className="hidden sm:inline">
              अद्यतन
            </span>

          </button>

        </div>

      </div>

    </header>

    {/* =================================================
        MAIN
    ================================================= */}

    <main className="mx-auto max-w-6xl space-y-3 px-3 py-3 sm:px-4 sm:py-4">

      {/* =================================================
          QUICK ACTIONS
      ================================================= */}

      <section className="grid grid-cols-2 gap-2.5">

        {/* NEW BOOKING */}

        <button
          type="button"
          onClick={() =>
            goTo("/new-booking")
          }
          className="flex min-h-[74px] items-center justify-between rounded-xl bg-slate-900 px-3.5 py-3 text-left text-white shadow-sm transition active:scale-[0.99]"
        >

          <div className="flex min-w-0 items-center gap-2.5">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <Plus size={19} />
            </div>

            <div className="min-w-0">

              <p className="text-sm font-bold">
                नवीन बुकिंग
              </p>

              <p className="mt-0.5 text-[11px] leading-4 text-slate-400">
                नवीन ऑर्डर नोंदवा
              </p>

            </div>

          </div>

          <ArrowRight
            size={17}
            className="shrink-0"
          />

        </button>

        {/* BOOKING HISTORY */}

        <button
          type="button"
          onClick={() =>
            goTo("/booking-history")
          }
          className="flex min-h-[74px] items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left shadow-sm transition active:scale-[0.99]"
        >

          <div className="flex min-w-0 items-center gap-2.5">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <History size={19} />
            </div>

            <div className="min-w-0">

              <p className="text-sm font-bold text-slate-900">
                बुकिंग हिस्ट्री
              </p>

              <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                सर्व बुकिंग पहा
              </p>

            </div>

          </div>

          <ArrowRight
            size={17}
            className="shrink-0 text-slate-400"
          />

        </button>

      </section>

      {/* =================================================
          UPCOMING
      ================================================= */}

      <button
        type="button"
        onClick={() =>
          goTo("/upcoming-orders")
        }
        className="flex min-h-[66px] w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left shadow-sm transition active:scale-[0.99]"
      >

        <div className="flex min-w-0 items-center gap-2.5">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <CalendarDays size={19} />
          </div>

          <div className="min-w-0">

            <p className="text-sm font-bold text-slate-900">
              आगामी बुकिंग
            </p>

            <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
              पुढील कार्यक्रम आणि ऑर्डर
            </p>

          </div>

        </div>

        <ArrowRight
          size={17}
          className="shrink-0 text-slate-400"
        />

      </button>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">

        <SummaryCard
          title="एकूण बुकिंग"
          value={summary.totalBookings}
          icon={
            <CalendarDays size={18} />
          }
        />

        <SummaryCard
          title="एकूण बिल"
          value={`₹${summary.totalAmount}`}
          icon={
            <IndianRupee size={18} />
          }
        />

        <SummaryCard
          title="मिळालेले"
          value={`₹${summary.received}`}
          icon={
            <CheckCircle2 size={18} />
          }
        />

        <SummaryCard
          title="बाकी"
          value={`₹${summary.remaining}`}
          icon={
            <Clock3 size={18} />
          }
        />

      </section>

      {/* =================================================
          MATERIAL STOCK
      ================================================= */}

      <section className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">

        <div className="flex items-center justify-between gap-3">

          <div className="flex min-w-0 items-center gap-2.5">

            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                outOfStockMaterials.length > 0
                  ? "bg-red-50 text-red-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >

              {outOfStockMaterials.length > 0 ? (
                <AlertCircle
                  size={18}
                />
              ) : (
                <Package size={18} />
              )}

            </div>

            <div className="min-w-0">

              <h2 className="text-sm font-black text-slate-900">
                साहित्य स्टॉक
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-500">
                सध्या उपलब्ध साहित्य
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              goTo("/material-stock")
            }
            className="min-h-10 shrink-0 rounded-xl bg-slate-900 px-3 text-[11px] font-bold text-white"
          >
            सर्व पहा
          </button>

        </div>

        {outOfStockMaterials.length > 0 ? (

          <div className="mt-3 space-y-2">

            {outOfStockMaterials
              .slice(0, 4)
              .map((material) => (

                <div
                  key={material.id}
                  className="flex min-h-[42px] items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2"
                >

                  <div className="flex min-w-0 items-center gap-2">

                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />

                    <span className="truncate text-xs font-bold text-slate-800">
                      {material.name}
                    </span>

                  </div>

                  <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-[10px] font-black text-red-700">
                    स्टॉक नाही
                  </span>

                </div>

              ))}

            {outOfStockMaterials.length > 4 && (

              <button
                type="button"
                onClick={() =>
                  goTo(
                    "/material-stock"
                  )
                }
                className="w-full py-1 text-center text-[11px] font-bold text-slate-500"
              >
                आणखी{" "}
                {outOfStockMaterials.length - 4}{" "}
                साहित्य पहा
              </button>

            )}

          </div>

        ) : (

          <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-emerald-50 px-3 py-3">

            <CheckCircle2
              size={19}
              className="shrink-0 text-emerald-600"
            />

            <p className="text-xs font-bold text-emerald-800">
              सगळे साहित्य उपलब्ध आहे.
            </p>

          </div>

        )}

      </section>
            {/* =================================================
          RECENT BOOKINGS
      ================================================= */}

      <section className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">

        <div className="flex items-center justify-between gap-2">

          <div className="min-w-0">

            <h2 className="text-sm font-black text-slate-900 sm:text-base">
              अलीकडील बुकिंग
            </h2>

            <p className="mt-0.5 text-[11px] text-slate-500">
              अलीकडे झालेल्या बुकिंग
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              goTo("/booking-history")
            }
            className="min-h-10 rounded-lg px-2.5 text-[11px] font-bold text-slate-700"
          >
            सर्व पहा
          </button>

        </div>

        {bookings.length === 0 ? (

          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-6 text-center">

            <Package
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-2 text-sm font-bold text-slate-600">
              अजून कोणतीही बुकिंग नाही.
            </p>

          </div>

        ) : (

          <div className="mt-3 space-y-2">

            {bookings
              .slice(0, 5)
              .map(
                (booking) => (
                  <RecentBooking
                    key={
                      booking.id
                    }
                    booking={
                      booking
                    }
                  />
                )
              )}

          </div>

        )}

      </section>

    </main>

  </div>
);
}

/* =====================================================
   SUMMARY CARD
===================================================== */

function SummaryCard({
  title,
  value,
  icon,
}) {
  return (
    <div className="min-h-[82px] rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm">

      <div className="flex items-center gap-2 text-slate-500">

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50">
          {icon}
        </div>

        <span className="truncate text-[11px] font-bold sm:text-xs">
          {title}
        </span>

      </div>

      <p className="mt-2 text-lg font-black text-slate-900 sm:text-xl">
        {value}
      </p>

    </div>
  );
}

/* =====================================================
   RECENT BOOKING
===================================================== */

function RecentBooking({
  booking,
}) {
  const formatDate = (
    date
  ) => {
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
  };

  /* ===================================================
     EVENT DAYS
  =================================================== */

  const daysRemaining =
    getDaysRemaining(
      booking.eventDate
    );

  let eventText =
    "कार्यक्रम";

  let eventClass =
    "text-orange-600";

  if (
    daysRemaining === 0
  ) {
    eventText =
      "कार्यक्रम आज";

    eventClass =
      "text-red-600";
  } else if (
    daysRemaining === 1
  ) {
    eventText =
      "कार्यक्रम उद्या";

    eventClass =
      "text-orange-600";
  } else if (
    daysRemaining === 2
  ) {
    eventText =
      "कार्यक्रम परवा";

    eventClass =
      "text-yellow-600";
  } else if (
    daysRemaining !== null &&
    daysRemaining > 2
  ) {
    eventText =
      `कार्यक्रम ${daysRemaining} दिवसांनी`;

    eventClass =
      "text-blue-600";
  }

  /* ===================================================
     MATERIAL STATUS
  =================================================== */

  const progress =
    booking.orderProgress ||
    "BOOKED";

  let materialText =
    "साहित्य दिले नाही";

  let materialClass =
    "bg-amber-50 text-amber-700";

  if (
    progress === "PICKED_UP"
  ) {
    materialText =
      "साहित्य दिले";

    materialClass =
      "bg-blue-50 text-blue-700";
  }

  if (
    progress ===
    "PARTIAL_RETURN"
  ) {
    materialText =
      "अंशतः परत";

    materialClass =
      "bg-orange-50 text-orange-700";
  }

  if (
    progress === "RETURNED"
  ) {
    materialText =
      "पूर्ण परत";

    materialClass =
      "bg-emerald-50 text-emerald-700";
  }

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3">

      {/* =================================================
          TOP
      ================================================= */}

      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">

          <div className="flex min-w-0 items-center gap-1.5">

            <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
              {booking.bookingNumber}
            </span>

            <span className="truncate text-sm font-black text-slate-900">
              {booking.customer?.name ||
                "-"}
            </span>

          </div>

          <p className="mt-1 text-[11px] text-slate-500">
            बुकिंग:{" "}
            {formatDate(
              booking.bookingDate
            )}
          </p>

          <p
            className={`mt-0.5 text-[11px] font-bold ${eventClass}`}
          >
            {eventText}:{" "}
            {formatDate(
              booking.eventDate
            )}
          </p>

        </div>

        <div className="shrink-0 text-right">

          <p className="text-base font-black text-slate-900">
            ₹
            {Number(
              booking.totalAmount ||
                0
            )}
          </p>

          <p className="mt-1 text-[11px] text-slate-500">
            {Number(
              booking.totalQuantity ||
                0
            )}{" "}
            नग
          </p>

        </div>

      </div>

      {/* =================================================
          LOWER INFO
      ================================================= */}

      <div className="mt-2.5 flex flex-wrap items-center gap-2">

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${materialClass}`}
        >
          {materialText}
        </span>

        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] text-slate-500">
          बुकिंग:{" "}
          <b className="text-slate-800">
            {booking.admin?.name ||
              "-"}
          </b>
        </span>

      </div>

    </div>
  );
}
export default Dashboard;