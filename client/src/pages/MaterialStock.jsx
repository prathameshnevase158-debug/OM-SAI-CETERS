import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  ArrowLeft,
  Package,
  RefreshCw,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Boxes,
} from "lucide-react";

const API_URL = "https://om-sai-ceters-server.onrender.com/api";

function MaterialStock() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* =====================================================
     FETCH MATERIALS
  ===================================================== */

  const fetchMaterials = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get(
        `${API_URL}/materials`
      );

      if (response.data?.success) {
        setMaterials(
          response.data.materials || []
        );
      }
    } catch (error) {
      console.error(
        "Material stock fetch error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Material stock मिळवताना error आला."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    fetchMaterials();
  }, []);

  /* =====================================================
     AUTO REFRESH
  ===================================================== */

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMaterials(true);
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /* =====================================================
     SUMMARY
  ===================================================== */

  const summary = useMemo(() => {
    const totalMaterials = materials.length;

    const totalStock = materials.reduce(
      (sum, material) =>
        sum + Number(material.stock || 0),
      0
    );

    const outOfStock = materials.filter(
      (material) =>
        Number(material.stock || 0) === 0
    ).length;

    const available = materials.filter(
      (material) =>
        Number(material.stock || 0) > 0
    ).length;

    return {
      totalMaterials,
      totalStock,
      outOfStock,
      available,
    };
  }, [materials]);

  /* =====================================================
     BACK
  ===================================================== */

  const goBack = () => {
    window.location.href = "/dashboard";
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb]">
        <div className="text-center">

          <RefreshCw
            size={30}
            className="mx-auto animate-spin text-slate-400"
          />

          <p className="mt-3 text-sm text-slate-500">
            Material Stock लोड होत आहे...
          </p>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7fb] pb-10">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={goBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              title="Dashboard"
            >
              <ArrowLeft size={19} />
            </button>

            <div>

              <p className="text-[10px] font-bold tracking-wider text-slate-400">
                OM SAI CETERS
              </p>

              <h1 className="text-xl font-black text-slate-900">
                Material Stock
              </h1>

            </div>

          </div>

          {/* REFRESH */}

          <button
            type="button"
            onClick={() =>
              fetchMaterials(true)
            }
            disabled={refreshing}
            className="flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >

            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            <span className="hidden sm:block">
              Refresh
            </span>

          </button>

        </div>

      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5">

        {/* =================================================
            PAGE INTRO
        ================================================= */}

        <section>

          <h2 className="text-2xl font-black text-slate-900">
            साहित्य Stock
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            तुमच्या catering business मधील सर्व materials
            आणि त्यांचा current stock येथे पहा.
          </p>

        </section>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StockSummaryCard
            title="एकूण Materials"
            value={summary.totalMaterials}
            icon={<Package size={18} />}
          />

          <StockSummaryCard
            title="Available"
            value={summary.available}
            icon={<CheckCircle2 size={18} />}
          />

          <StockSummaryCard
            title="Out of Stock"
            value={summary.outOfStock}
            icon={<AlertCircle size={18} />}
            danger={summary.outOfStock > 0}
          />

          <StockSummaryCard
            title="Total Stock"
            value={`${summary.totalStock} नग`}
            icon={<Boxes size={18} />}
          />

        </section>

        {/* =================================================
            EMPTY
        ================================================= */}

        {materials.length === 0 ? (

          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">

            <Package
              size={42}
              className="mx-auto text-slate-300"
            />

            <h3 className="mt-4 font-black text-slate-800">
              कोणतेही Material उपलब्ध नाही
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Prisma Studio मधून materials add करा.
            </p>

          </section>

        ) : (

          /* =================================================
             MATERIAL LIST
          ================================================= */

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h2 className="font-black text-slate-900">
                  All Materials
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  सर्व available आणि out of stock materials
                </p>

              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600">
                {materials.length} प्रकार
              </span>

            </div>

            {/* =================================================
                MATERIAL GRID

                Desktop = 6 cards per row
                Tablet  = 4 cards
                Small   = 3 cards
                Mobile  = 2 cards
            ================================================= */}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">

              {materials.map((material) => {

                const stock =
                  Number(material.stock || 0);

                const rate =
                  Number(material.rate || 0);

                const isOutOfStock =
                  stock === 0;

                return (
                  <div
                    key={material.id}
                    className={`rounded-xl border p-3 transition hover:-translate-y-0.5 hover:shadow-md ${
                      isOutOfStock
                        ? "border-red-200 bg-red-50/40"
                        : "border-slate-200 bg-white"
                    }`}
                  >

                    {/* =================================================
                        MATERIAL NAME
                    ================================================= */}

                    <div className="min-w-0">

                      <div
                        className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${
                          isOutOfStock
                            ? "bg-red-100 text-red-600"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <Package size={17} />
                      </div>

                      <p className="truncate text-sm font-black text-slate-900">
                        {material.name}
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-400">
                        #{material.id}
                      </p>

                    </div>

                    {/* =================================================
                        STATUS
                    ================================================= */}

                    <div className="mt-3">

                      {isOutOfStock ? (

                        <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-[9px] font-black text-red-700">
                          Out of Stock
                        </span>

                      ) : (

                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black text-emerald-700">
                          Available
                        </span>

                      )}

                    </div>

                    {/* =================================================
                        STOCK
                    ================================================= */}

                    <div className="mt-3 rounded-lg bg-slate-50 p-2.5">

                      <p className="text-[9px] font-semibold text-slate-500">
                        Available
                      </p>

                      <div className="mt-0.5 flex items-end justify-between">

                        <p
                          className={`text-xl font-black ${
                            isOutOfStock
                              ? "text-red-600"
                              : "text-slate-900"
                          }`}
                        >
                          {stock}
                        </p>

                        <span className="pb-0.5 text-[9px] font-semibold text-slate-400">
                          नग
                        </span>

                      </div>

                    </div>

                    {/* =================================================
                        RATE
                    ================================================= */}

                    <div className="mt-2 flex items-center justify-between">

                      <div className="flex items-center gap-1 text-slate-400">

                        <IndianRupee size={12} />

                        <span className="text-[9px] font-semibold">
                          Rate
                        </span>

                      </div>

                      <p className="text-xs font-black text-slate-900">
                        ₹{rate}
                      </p>

                    </div>

                  </div>
                );
              })}

            </div>

          </section>

        )}

       
      </main>

    </div>
  );
}

/* =====================================================
   SUMMARY CARD
===================================================== */

function StockSummaryCard({
  title,
  value,
  icon,
  danger = false,
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm ${
        danger
          ? "border-red-200"
          : "border-slate-200"
      }`}
    >

      <div
        className={`flex items-center gap-2 ${
          danger
            ? "text-red-600"
            : "text-slate-500"
        }`}
      >

        {icon}

        <span className="text-xs font-semibold">
          {title}
        </span>

      </div>

      <p
        className={`mt-2 text-xl font-black ${
          danger
            ? "text-red-600"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>

    </div>
  );
}

export default MaterialStock;
