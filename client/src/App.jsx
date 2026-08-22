import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import Dashboard from "./pages/Dashboard";
import NewBooking from "./pages/NewBooking";
import BookingHistory from "./pages/BookingHistory";
import NotificationPage from "./pages/NotificationPage";
import UpcomingOrders from "./pages/UpcomingOrders";
import BookingDetails from "./pages/BookingDetails";
import MaterialStock from "./pages/MaterialStock";

const API_URL = "http://10.42.240.226:5000/api";

/* =====================================================
   GET SAVED ADMIN
===================================================== */

const getSavedAdmin = () => {
  try {
    const saved = localStorage.getItem(
      "om_sai_selected_admin"
    );

    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved);

    if (!parsed?.id) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error(
      "Saved admin read error:",
      error
    );

    return null;
  }
};

/* =====================================================
   SAVE ADMIN
===================================================== */

const saveAdmin = (admin) => {
  localStorage.setItem(
    "om_sai_selected_admin",
    JSON.stringify(admin)
  );

  window.location.href = "/dashboard";
};

/* =====================================================
   ADMIN SELECT PAGE
===================================================== */

function AdminSelectPage() {
  const [admins, setAdmins] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ===================================================
     FETCH ADMINS
  =================================================== */

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setLoading(true);
        setError("");
      
        console.log("ADMIN API URL:", `${API_URL}/admins`);
        
        const response =
          await axios.get(
            `${API_URL}/admins`
          );

        if (
          response.data?.success
        ) {
          setAdmins(
            response.data.admins ||
              []
          );
        } else {
          setError(
            response.data?.message ||
              "Admins मिळाले नाहीत."
          );
        }
      } catch (error) {
        console.error(
          "Admins fetch error:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Admins मिळवताना error आला."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  /* ===================================================
     LOADING
  =================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-lg font-black text-white">
            OS
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Users लोड होत आहेत...
          </p>
        </div>
      </div>
    );
  }

  /* ===================================================
     ERROR
  =================================================== */

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4">

        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
            !
          </div>

          <h2 className="mt-4 text-lg font-black text-slate-900">
            Admins load झाले नाहीत
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
          >
            पुन्हा प्रयत्न करा
          </button>

        </div>
      </div>
    );
  }

  /* ===================================================
     EMPTY
  =================================================== */

  if (admins.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4">

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">

          <h2 className="text-lg font-black text-slate-900">
            कोणताही Admin उपलब्ध नाही
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Prisma Studio मध्ये Admin records तपासा.
          </p>

        </div>
      </div>
    );
  }

  /* ===================================================
     UI
  =================================================== */

  return (
    <div className="min-h-screen bg-[#f6f7fb] px-4 py-8">

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">

        <div className="w-full">

          {/* =================================================
              BRAND
          ================================================= */}

          <div className="mb-7 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-black text-white shadow-lg">
              OS
            </div>

            <p className="mt-4 text-xs font-bold tracking-[0.18em] text-slate-400">
              OM SAI CATERERS
            </p>

            <h1 className="mt-2 text-2xl font-black text-slate-900">
              कोण वापरत आहे?
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              तुमचे नाव निवडा आणि काम सुरू करा.
            </p>

          </div>

          {/* =================================================
              ADMIN LIST
          ================================================= */}

          <div className="space-y-3">

            {admins.map((admin) => (
              <button
                key={admin.id}
                type="button"
                onClick={() =>
                  saveAdmin(admin)
                }
                className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md active:scale-[0.99]"
              >

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg font-black text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
                  {admin.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "A"}
                </div>

                <div className="min-w-0 flex-1">

                  <p className="font-black text-slate-900">
                    {admin.name}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    OM SAI CATERERS
                  </p>

                </div>

                <div className="text-lg text-slate-300 transition group-hover:text-slate-600">
                  →
                </div>

              </button>
            ))}

          </div>

          <p className="mt-6 text-center text-[11px] leading-5 text-slate-400">
            एकदा user निवडल्यानंतर तो या device वर save राहील.
            <br />
            दुसरा user वापरायचा असल्यास Admin बदला.
          </p>

        </div>

      </div>
    </div>
  );
}

/* =====================================================
   ADMIN GUARD
===================================================== */

function AdminGuard({
  children,
}) {
  const admin =
    getSavedAdmin();

  if (!admin) {
    return (
      <Navigate
        to="/select-admin"
        replace
      />
    );
  }

  return children;
}

/* =====================================================
   APP
===================================================== */

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =================================================
            ADMIN SELECT
        ================================================= */}

        <Route
          path="/select-admin"
          element={
            <AdminSelectPage />
          }
        />

        {/* =================================================
            DASHBOARD
        ================================================= */}

     <Route
  path="/"
  element={
    <Navigate
      to="/select-admin"
      replace
    />
  }
/>

        <Route
          path="/dashboard"
          element={
            <AdminGuard>
              <Dashboard />
            </AdminGuard>
          }
        />

        {/* =================================================
            NEW BOOKING
        ================================================= */}

        <Route
          path="/new-booking"
          element={
            <AdminGuard>
              <NewBooking />
            </AdminGuard>
          }
        />

        {/* =================================================
            BOOKING HISTORY
        ================================================= */}

        <Route
          path="/booking-history"
          element={
            <AdminGuard>
              <BookingHistory />
            </AdminGuard>
          }
        />

        {/* =================================================
            NOTIFICATIONS
        ================================================= */}

        <Route
          path="/notifications"
          element={
            <AdminGuard>
              <NotificationPage />
            </AdminGuard>
          }
        />

        {/* =================================================
            UPCOMING ORDERS
        ================================================= */}

        <Route
          path="/upcoming-orders"
          element={
            <AdminGuard>
              <UpcomingOrders />
            </AdminGuard>
          }
        />

        {/* =================================================
            BOOKING DETAILS
        ================================================= */}

        <Route
          path="/bookings/:id"
          element={
            <AdminGuard>
              <BookingDetails />
            </AdminGuard>
          }
        />

        {/* =================================================
            MATERIAL STOCK
        ================================================= */}

        <Route
          path="/material-stock"
          element={
            <AdminGuard>
              <MaterialStock />
            </AdminGuard>
          }
        />

        {/* =================================================
            DEFAULT
        ================================================= */}

       <Route
  path="*"
  element={
    <Navigate
      to="/select-admin"
      replace
    />
  }
/>

      </Routes>

    </BrowserRouter>
  );
}

export default App;