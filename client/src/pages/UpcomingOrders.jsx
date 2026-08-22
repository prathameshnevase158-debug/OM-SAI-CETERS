import {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  User,
  Phone,
  Package,
  IndianRupee,
  RefreshCw,
  ChevronRight,
  Users,
  Truck,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

/* =====================================================
   API
===================================================== */

const API_URL = "https://om-sai-ceters-server.onrender.com/api";

/* =====================================================
   UPCOMING ORDERS
===================================================== */

function UpcomingOrders() {
  /* ===================================================
     BOOKINGS
  =================================================== */

  const [bookings, setBookings] =
    useState([]);

  /* ===================================================
     LOADING
  =================================================== */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  /* ===================================================
     FETCH UPCOMING
  =================================================== */

  const fetchUpcomingOrders =
    async (
      showRefresh = false
    ) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response =
          await axios.get(
            `${API_URL}/bookings/pending`
          );

        if (
          response.data?.success
        ) {
          setBookings(
            response.data.bookings ||
              []
          );
        } else {
          setBookings([]);
        }
      } catch (error) {
        console.error(
          "Upcoming orders fetch error:",
          error
        );

        if (!showRefresh) {
          alert(
            error.response?.data
              ?.message ||
              "आगामी बुकिंग मिळवताना त्रुटी आली."
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  /* ===================================================
     FIRST LOAD + AUTO REFRESH
  =================================================== */

  useEffect(() => {
    fetchUpcomingOrders();

    const interval =
      setInterval(() => {
        fetchUpcomingOrders(true);
      }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /* ===================================================
     TODAY
  =================================================== */

  const getTodayStart = () => {
    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    return today;
  };

  /* ===================================================
     DAYS REMAINING
  =================================================== */

  const getDaysRemaining = (
    eventDate
  ) => {
    if (!eventDate) {
      return null;
    }

    const today =
      getTodayStart();

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

    const difference =
      event.getTime() -
      today.getTime();

    return Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    );
  };

  /* ===================================================
     DATE FORMAT
  =================================================== */

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
     STATUS TEXT
  =================================================== */

  const getProgressText =
    (progress) => {
      if (
        progress ===
        "PICKED_UP"
      ) {
        return "साहित्य दिले";
      }

      if (
        progress ===
        "PARTIAL_RETURN"
      ) {
        return "अंशतः परत";
      }

      if (
        progress ===
        "RETURNED"
      ) {
        return "पूर्ण परत";
      }

      return "साहित्य दिले नाही";
    };

  /* ===================================================
     STATUS CLASS
  =================================================== */

  const getProgressClass =
    (progress) => {
      if (
        progress ===
        "PICKED_UP"
      ) {
        return "border-blue-200 bg-blue-50 text-blue-700";
      }

      if (
        progress ===
        "PARTIAL_RETURN"
      ) {
        return "border-orange-200 bg-orange-50 text-orange-700";
      }

      if (
        progress ===
        "RETURNED"
      ) {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      }

      return "border-amber-200 bg-amber-50 text-amber-700";
    };

  /* ===================================================
     DAY LABEL
  =================================================== */

  const getDayLabel =
    (days) => {
      if (days === 0) {
        return "आज";
      }

      if (days === 1) {
        return "उद्या";
      }

      if (days === 2) {
        return "परवा";
      }

      if (
        days !== null &&
        days > 2
      ) {
        return `${days} दिवसांनी`;
      }

      return "";
    };

  /* ===================================================
     SORT
  =================================================== */

  const sortedBookings =
    useMemo(() => {
      return [...bookings].sort(
        (a, b) =>
          new Date(
            a.eventDate
          ) -
          new Date(
            b.eventDate
          )
      );
    }, [bookings]);

  /* ===================================================
     GROUP
  =================================================== */

  const grouped =
    useMemo(() => {
      const today = [];
      const tomorrow = [];
      const dayAfter = [];
      const later = [];

      sortedBookings.forEach(
        (booking) => {
          const days =
            getDaysRemaining(
              booking.eventDate
            );

          if (days === 0) {
            today.push(booking);
          } else if (days === 1) {
            tomorrow.push(
              booking
            );
          } else if (days === 2) {
            dayAfter.push(
              booking
            );
          } else if (
            days !== null &&
            days > 2
          ) {
            later.push(
              booking
            );
          }
        }
      );

      return {
        today,
        tomorrow,
        dayAfter,
        later,
      };
    }, [sortedBookings]);

  /* ===================================================
     COUNTS
  =================================================== */

  const summary = useMemo(
    () => ({
      today:
        grouped.today.length,

      tomorrow:
        grouped.tomorrow.length,

      dayAfter:
        grouped.dayAfter.length,

      total:
        sortedBookings.length,
    }),
    [grouped, sortedBookings]
  );

  /* ===================================================
     BACK
  =================================================== */

  const goBack = () => {
    window.location.href =
      "/dashboard";
  };

  /* ===================================================
     OPEN BOOKING
  =================================================== */

  const openBooking = (
    id
  ) => {
    window.location.href =
      `/bookings/${id}`;
  };

  /* ===================================================
     LOADING
  =================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4">

        <div className="text-center">

          <RefreshCw
            size={28}
            className="mx-auto animate-spin text-slate-400"
          />

          <p className="mt-2 text-xs text-slate-500">
            आगामी बुकिंग लोड होत आहेत...
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

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-3 sm:px-4">

          <div className="flex min-w-0 items-center gap-2.5">

            <button
              type="button"
              onClick={goBack}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="min-w-0">

              <p className="truncate text-[9px] font-bold tracking-[0.12em] text-slate-400">
                OM SAI CETERS
              </p>

              <h1 className="truncate text-sm font-black text-slate-900">
                आगामी बुकिंग
              </h1>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              fetchUpcomingOrders(
                true
              )
            }
            disabled={
              refreshing
            }
            className="flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white disabled:opacity-60"
          >

            <RefreshCw
              size={14}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            अद्यतन

          </button>

        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="mx-auto max-w-5xl space-y-3 px-3 py-3 sm:px-4 sm:py-4">

        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">

          <SummaryCard
            title="आज"
            value={
              summary.today
            }
            icon={
              <CalendarDays
                size={16}
              />
            }
          />

          <SummaryCard
            title="उद्या"
            value={
              summary.tomorrow
            }
            icon={
              <Clock3 size={16} />
            }
          />

          <SummaryCard
            title="परवा"
            value={
              summary.dayAfter
            }
            icon={
              <CalendarDays
                size={16}
              />
            }
          />

          <SummaryCard
            title="एकूण"
            value={
              summary.total
            }
            icon={
              <Package
                size={16}
              />
            }
          />

        </section>
 

        {sortedBookings.length === 0 ? (

          /* =================================================
             EMPTY STATE
          ================================================= */

          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">

            <CalendarDays
              size={30}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-3 text-sm font-black text-slate-800">
              कोणतीही आगामी बुकिंग नाही
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              पुढील कार्यक्रम असलेली बुकिंग येथे दिसेल.
            </p>

          </div>

        ) : (

          <div className="space-y-3">

            {/* =================================================
                TODAY
            ================================================= */}

            {grouped.today.length > 0 && (
              <BookingSection
                title="आजचे कार्यक्रम"
                subtitle="आज कार्यक्रम असलेल्या बुकिंग"
                bookings={
                  grouped.today
                }
                getDaysRemaining={
                  getDaysRemaining
                }
                getDayLabel={
                  getDayLabel
                }
                getProgressText={
                  getProgressText
                }
                getProgressClass={
                  getProgressClass
                }
                formatDate={
                  formatDate
                }
                openBooking={
                  openBooking
                }
              />
            )}

            {/* =================================================
                TOMORROW
            ================================================= */}

            {grouped.tomorrow.length > 0 && (
              <BookingSection
                title="उद्याचे कार्यक्रम"
                subtitle="उद्या कार्यक्रम असलेल्या बुकिंग"
                bookings={
                  grouped.tomorrow
                }
                getDaysRemaining={
                  getDaysRemaining
                }
                getDayLabel={
                  getDayLabel
                }
                getProgressText={
                  getProgressText
                }
                getProgressClass={
                  getProgressClass
                }
                formatDate={
                  formatDate
                }
                openBooking={
                  openBooking
                }
              />
            )}

            {/* =================================================
                DAY AFTER
            ================================================= */}

            {grouped.dayAfter.length > 0 && (
              <BookingSection
                title="परवाचे कार्यक्रम"
                subtitle="परवा कार्यक्रम असलेल्या बुकिंग"
                bookings={
                  grouped.dayAfter
                }
                getDaysRemaining={
                  getDaysRemaining
                }
                getDayLabel={
                  getDayLabel
                }
                getProgressText={
                  getProgressText
                }
                getProgressClass={
                  getProgressClass
                }
                formatDate={
                  formatDate
                }
                openBooking={
                  openBooking
                }
              />
            )}

            {/* =================================================
                LATER
            ================================================= */}

            {grouped.later.length > 0 && (
              <BookingSection
                title="पुढील कार्यक्रम"
                subtitle="पुढील दिवसांतील बुकिंग"
                bookings={
                  grouped.later
                }
                getDaysRemaining={
                  getDaysRemaining
                }
                getDayLabel={
                  getDayLabel
                }
                getProgressText={
                  getProgressText
                }
                getProgressClass={
                  getProgressClass
                }
                formatDate={
                  formatDate
                }
                openBooking={
                  openBooking
                }
              />
            )}

          </div>

        )}

      </main>

    </div>
  );
}

/* =====================================================
   BOOKING SECTION
===================================================== */

function BookingSection({
  title,
  subtitle,
  bookings,
  getDaysRemaining,
  getDayLabel,
  getProgressText,
  getProgressClass,
  formatDate,
  openBooking,
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">

      {/* =================================================
          SECTION HEADER
      ================================================= */}

      <div className="mb-2.5 flex items-center justify-between gap-2 px-1">

        <div className="min-w-0">

          <h2 className="truncate text-xs font-black text-slate-900 sm:text-sm">
            {title}
          </h2>

          <p className="mt-0.5 truncate text-[9px] text-slate-400">
            {subtitle}
          </p>

        </div>

        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-600">
          {bookings.length}
        </span>

      </div>

      {/* =================================================
          CARDS
      ================================================= */}

      <div className="space-y-2">

        {bookings.map(
          (booking) => (
            <UpcomingBookingCard
              key={
                booking.id
              }
              booking={
                booking
              }
              daysRemaining={
                getDaysRemaining(
                  booking.eventDate
                )
              }
              dayLabel={
                getDayLabel(
                  getDaysRemaining(
                    booking.eventDate
                  )
                )
              }
              progressText={
                getProgressText(
                  booking.orderProgress
                )
              }
              progressClass={
                getProgressClass(
                  booking.orderProgress
                )
              }
              formatDate={
                formatDate
              }
              openBooking={
                openBooking
              }
            />
          )
        )}

      </div>

    </section>
  );
}
/* =====================================================
   UPCOMING BOOKING CARD
===================================================== */

function UpcomingBookingCard({
  booking,
  daysRemaining,
  dayLabel,
  progressText,
  progressClass,
  formatDate,
  openBooking,
}) {
  const bookedBy =
    booking.admin?.name ||
    "-";

  const pickedUpBy =
    booking.pickedUpByAdmin?.name ||
    "";

  const returnedBy =
    booking.returnByAdmin?.name ||
    "";

  const totalAmount =
    Number(
      booking.totalAmount || 0
    );

  const advanceAmount =
    Number(
      booking.advanceAmount || 0
    );

  const remainingAmount =
    Number(
      booking.remainingAmount || 0
    );

  const totalQuantity =
    Number(
      booking.totalQuantity || 0
    );

  const progress =
    booking.orderProgress ||
    "BOOKED";

  const isToday =
    daysRemaining === 0;

  const isTomorrow =
    daysRemaining === 1;

  /* =================================================
     DAY STYLE
  ================================================= */

  let dayClass =
    "bg-slate-100 text-slate-700";

  if (isToday) {
    dayClass =
      "bg-red-50 text-red-700";
  } else if (isTomorrow) {
    dayClass =
      "bg-orange-50 text-orange-700";
  } else if (
    daysRemaining === 2
  ) {
    dayClass =
      "bg-yellow-50 text-yellow-700";
  } else {
    dayClass =
      "bg-blue-50 text-blue-700";
  }

  /* =================================================
     PAYMENT STATUS
  ================================================= */

  let paymentText =
    "पैसे बाकी";

  let paymentClass =
    "text-red-600";

  if (
    booking.paymentStatus ===
    "PAID"
  ) {
    paymentText =
      "पूर्ण भरले";

    paymentClass =
      "text-emerald-600";
  } else if (
    booking.paymentStatus ===
    "PARTIAL"
  ) {
    paymentText =
      "अंशतः भरले";

    paymentClass =
      "text-orange-600";
  }

  return (
    <div
      className={`
        rounded-lg border bg-white
        px-3 py-2.5
        shadow-sm
        transition
        hover:shadow
        ${
          isToday
            ? "border-red-200"
            : isTomorrow
            ? "border-orange-200"
            : "border-slate-200"
        }
      `}
    >

      {/* =================================================
          TOP ROW
      ================================================= */}

      <div className="flex items-center justify-between gap-2">

        <div className="flex min-w-0 items-center gap-1.5">

          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-black text-slate-500">
            बिल
          </span>

          <span className="text-xs font-black text-slate-900">
            {booking.bookingNumber}
          </span>

          <span className="truncate text-xs font-bold text-slate-600">
            {booking.customer?.name ||
              "-"}
          </span>

        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-black ${dayClass}`}
        >
          {dayLabel}
        </span>

      </div>

      {/* =================================================
          EVENT + CUSTOMER
      ================================================= */}

      <div className="mt-1.5 flex items-center justify-between gap-2">

        <div className="min-w-0">

          <p className="flex items-center gap-1 text-[9px] text-slate-400">
            <CalendarDays size={11} />

            कार्यक्रम
          </p>

          <p className="mt-0.5 text-[10px] font-black text-slate-800">
            {formatDate(
              booking.eventDate
            )}
          </p>

        </div>

        <div className="min-w-0 text-right">

          <p className="flex items-center justify-end gap-1 text-[9px] text-slate-400">
            <Phone size={11} />

            मोबाईल
          </p>

          <p className="mt-0.5 truncate text-[10px] font-bold text-slate-700">
            {booking.customer?.mobile ||
              "-"}
          </p>

        </div>

      </div>

      {/* =================================================
          QUICK INFO
      ================================================= */}

      <div className="mt-1.5 grid grid-cols-3 gap-1">

        <QuickInfo
          label="साहित्य"
          value={`${totalQuantity} नग`}
        />

        <QuickInfo
          label="एकूण"
          value={`₹${totalAmount}`}
        />

        <QuickInfo
          label="बाकी"
          value={`₹${remainingAmount}`}
        />

      </div>

      {/* =================================================
          ADMIN TRACKING
      ================================================= */}

      <div className="mt-1.5 rounded-md bg-slate-50 px-2 py-1.5">

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px]">

          <span className="text-slate-500">
            बुकिंग:
            <b className="ml-1 text-slate-800">
              {bookedBy}
            </b>
          </span>

          {pickedUpBy && (
            <>
              <span className="text-slate-300">
                |
              </span>

              <span className="text-blue-600">
                दिले:
                <b className="ml-1">
                  {pickedUpBy}
                </b>
              </span>
            </>
          )}

          {returnedBy && (
            <>
              <span className="text-slate-300">
                |
              </span>

              <span className="text-emerald-600">
                परत:
                <b className="ml-1">
                  {returnedBy}
                </b>
              </span>
            </>
          )}

        </div>

      </div>

      {/* =================================================
          MATERIAL STATUS
      ================================================= */}

      <div
        className={`mt-1.5 flex items-center justify-between rounded-md border px-2 py-1.5 ${progressClass}`}
      >

        <div className="flex items-center gap-1.5">

          <Package size={12} />

          <span className="text-[9px] opacity-70">
            साहित्य स्थिती
          </span>

        </div>

        <span className="text-[10px] font-black">
          {progressText}
        </span>

      </div>

      {/* =================================================
          PAYMENT
      ================================================= */}

      <div className="mt-1 flex items-center justify-between text-[9px]">

        <span className={paymentClass}>
          पेमेंट:{" "}
          <b>
            {paymentText}
          </b>
        </span>

        <span className="text-slate-500">
          जमा:{" "}
          <b className="text-emerald-600">
            ₹{advanceAmount}
          </b>
        </span>

      </div>

      {/* =================================================
          OPEN
      ================================================= */}

      <button
        type="button"
        onClick={() =>
          openBooking(
            booking.id
          )
        }
        className="mt-1.5 flex w-full items-center justify-between rounded-md bg-slate-900 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-slate-800"
      >

        <span>
          पूर्ण माहिती पहा
        </span>

        <ChevronRight size={13} />

      </button>

    </div>
  );
}

/* =====================================================
   QUICK INFO
===================================================== */

function QuickInfo({
  label,
  value,
}) {
  return (
    <div className="rounded-md bg-slate-50 px-2 py-1.5 text-center">

      <p className="text-[8px] text-slate-400">
        {label}
      </p>

      <p className="mt-0.5 text-[10px] font-black text-slate-800">
        {value}
      </p>

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
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">

      <div className="flex items-center gap-1.5">

        <div className="text-slate-500">
          {icon}
        </div>

        <span className="text-[9px] font-bold text-slate-500">
          {title}
        </span>

      </div>

      <p className="mt-1 text-base font-black text-slate-900">
        {value}
      </p>

    </div>
  );
}
/* =====================================================
   END
===================================================== */

export default UpcomingOrders;