import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  ArrowLeft,
  CalendarDays,
  Phone,
  User,
  Package,
  Plus,
  Trash2,
  MapPin,
  IndianRupee,
  Loader2,
  CheckCircle2,
  MessageCircle,
  UserRound,
} from "lucide-react";

const API_URL = "http://10.42.240.226:5000/api";

/* =========================================================
   GET CURRENT ADMIN
========================================================= */

const getCurrentAdmin = () => {
  try {
    const saved = localStorage.getItem(
      "om_sai_selected_admin"
    );

    if (!saved) {
      return null;
    }

    return JSON.parse(saved);
  } catch (error) {
    console.error(
      "Current admin read error:",
      error
    );

    return null;
  }
};

function NewBooking() {
  /* =======================================================
     CURRENT ADMIN
  ======================================================= */

  const [currentAdmin] = useState(
    getCurrentAdmin()
  );

  /* =======================================================
     CUSTOMER
  ======================================================= */

  const [customer, setCustomer] = useState({
    name: "",
    mobile: "",
    address: "",
  });

  /* =======================================================
     DATES
  ======================================================= */

  const [bookingDate, setBookingDate] =
    useState("");

  const [eventDate, setEventDate] =
    useState("");

  /* =======================================================
     MATERIALS
  ======================================================= */

  const [materials, setMaterials] =
    useState([]);

  const [selectedMaterials, setSelectedMaterials] =
    useState([]);

  const [selectedMaterialId, setSelectedMaterialId] =
    useState("");

  const [quantity, setQuantity] =
    useState(1);

  const [loadingMaterials, setLoadingMaterials] =
    useState(true);

  /* =======================================================
     PAYMENT
  ======================================================= */

  const [advance, setAdvance] =
    useState("");

  /* =======================================================
     SAVE
  ======================================================= */

  const [saving, setSaving] =
    useState(false);

  const [savedBooking, setSavedBooking] =
    useState(null);

  /* =======================================================
     WHATSAPP
  ======================================================= */

  const [openingWhatsApp, setOpeningWhatsApp] =
    useState(false);

  /* =======================================================
     FETCH MATERIALS
  ======================================================= */

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoadingMaterials(true);

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
        "Materials fetch error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "साहित्य मिळवताना error आला."
      );
    } finally {
      setLoadingMaterials(false);
    }
  };

  /* =======================================================
     SELECTED MATERIAL
  ======================================================= */

  const selectedMaterial = useMemo(() => {
    return materials.find(
      (item) =>
        Number(item.id) ===
        Number(selectedMaterialId)
    );
  }, [
    materials,
    selectedMaterialId,
  ]);

  /* =======================================================
     TOTAL QUANTITY
  ======================================================= */

  const totalQuantity = useMemo(() => {
    return selectedMaterials.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );
  }, [selectedMaterials]);

  /* =======================================================
     TOTAL BILL
  ======================================================= */

  const total = useMemo(() => {
    return selectedMaterials.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity || 0) *
          Number(item.rate || 0),
      0
    );
  }, [selectedMaterials]);

  /* =======================================================
     ADVANCE / REMAINING
  ======================================================= */

  const advanceAmount = Number(
    advance || 0
  );

  const remaining = Math.max(
    total - advanceAmount,
    0
  );

  /* =======================================================
     PAYMENT STATUS
  ======================================================= */

  const paymentStatus = useMemo(() => {
    if (total === 0) {
      return "PENDING";
    }

    if (advanceAmount >= total) {
      return "PAID";
    }

    if (advanceAmount > 0) {
      return "PARTIAL";
    }

    return "PENDING";
  }, [
    total,
    advanceAmount,
  ]);

  /* =======================================================
     CUSTOMER UPDATE
  ======================================================= */

  const updateCustomer = (
    field,
    value
  ) => {
    setCustomer((current) => ({
      ...current,
      [field]: value,
    }));

    setSavedBooking(null);
  };

  /* =======================================================
     BOOKING DATE
  ======================================================= */

  const handleBookingDateChange = (
    value
  ) => {
    setBookingDate(value);

    setSavedBooking(null);

    if (
      eventDate &&
      value &&
      eventDate < value
    ) {
      setEventDate("");
    }
  };

  /* =======================================================
     EVENT DATE
  ======================================================= */

  const handleEventDateChange = (
    value
  ) => {
    if (
      bookingDate &&
      value &&
      value < bookingDate
    ) {
      alert(
        "कार्यक्रमाची तारीख बुकिंगच्या तारखेपेक्षा आधीची असू शकत नाही."
      );

      return;
    }

    setEventDate(value);
    setSavedBooking(null);
  };

  /* =======================================================
     ADD MATERIAL
  ======================================================= */

  const addMaterial = () => {
    if (!selectedMaterialId) {
      alert("कृपया साहित्य निवडा.");
      return;
    }

    if (!selectedMaterial) {
      alert(
        "निवडलेले साहित्य सापडले नाही."
      );
      return;
    }

    const qty = Number(quantity);

    if (
      !Number.isInteger(qty) ||
      qty < 1
    ) {
      alert("योग्य संख्या टाका.");
      return;
    }

    if (
      qty >
      Number(
        selectedMaterial.stock || 0
      )
    ) {
      alert(
        `${selectedMaterial.name} फक्त ${selectedMaterial.stock} नग उपलब्ध आहेत.`
      );

      return;
    }

    const alreadyExists =
      selectedMaterials.some(
        (item) =>
          Number(item.id) ===
          Number(
            selectedMaterial.id
          )
      );

    if (alreadyExists) {
      alert(
        "हे साहित्य आधीच जोडले आहे."
      );

      return;
    }

    setSelectedMaterials(
      (current) => [
        ...current,
        {
          id: Number(
            selectedMaterial.id
          ),

          name:
            selectedMaterial.name,

          stock: Number(
            selectedMaterial.stock || 0
          ),

          rate: Number(
            selectedMaterial.rate || 0
          ),

          quantity: qty,
        },
      ]
    );

    setSelectedMaterialId("");
    setQuantity(1);
    setSavedBooking(null);
  };

  /* =======================================================
     UPDATE MATERIAL QUANTITY
  ======================================================= */

  const updateQuantity = (
    id,
    value
  ) => {
    let qty = Number(value);

    if (
      !Number.isInteger(qty) ||
      qty < 1
    ) {
      qty = 1;
    }

    setSelectedMaterials(
      (current) =>
        current.map((item) => {
          if (
            Number(item.id) !==
            Number(id)
          ) {
            return item;
          }

          if (
            qty >
            Number(
              item.stock || 0
            )
          ) {
            alert(
              `${item.name} फक्त ${item.stock} नग उपलब्ध आहेत.`
            );

            return {
              ...item,
              quantity:
                Number(
                  item.stock || 1
                ),
            };
          }

          return {
            ...item,
            quantity: qty,
          };
        })
    );

    setSavedBooking(null);
  };

  /* =======================================================
     REMOVE MATERIAL
  ======================================================= */

  const removeMaterial = (id) => {
    setSelectedMaterials(
      (current) =>
        current.filter(
          (item) =>
            Number(item.id) !==
            Number(id)
        )
    );

    setSavedBooking(null);
  };

  /* =======================================================
     FORMAT DATE
  ======================================================= */

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parts =
      String(date).split("-");

    if (parts.length !== 3) {
      return String(date);
    }

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  /* =======================================================
     FORMAT BOOKING NUMBER
  ======================================================= */

  const formatBookingNumber = (
    bookingNumber
  ) => {
    if (
      bookingNumber === null ||
      bookingNumber === undefined ||
      bookingNumber === ""
    ) {
      return "-";
    }

    return String(
      bookingNumber
    );
  };

  /* =======================================================
     SAVE BOOKING
  ======================================================= */

  const handleSaveBooking = async () => {
    try {
      /* ===================================================
         ADMIN CHECK
      =================================================== */

      if (!currentAdmin?.id) {
        alert(
          "कृपया आधी Admin निवडा."
        );

        window.location.href =
          "/select-admin";

        return;
      }

      /* ===================================================
         CUSTOMER
      =================================================== */

      if (!customer.name.trim()) {
        alert(
          "कृपया ग्राहकाचे नाव टाका."
        );

        return;
      }

      if (!customer.mobile.trim()) {
        alert(
          "कृपया मोबाईल नंबर टाका."
        );

        return;
      }

      if (
        customer.mobile.length !== 10
      ) {
        alert(
          "मोबाईल नंबर 10 अंकी असावा."
        );

        return;
      }

      /* ===================================================
         DATES
      =================================================== */

      if (!bookingDate) {
        alert(
          "कृपया बुकिंगची तारीख निवडा."
        );

        return;
      }

      if (!eventDate) {
        alert(
          "कृपया कार्यक्रमाची तारीख निवडा."
        );

        return;
      }

      if (
        eventDate < bookingDate
      ) {
        alert(
          "कार्यक्रमाची तारीख बुकिंगच्या तारखेपेक्षा आधीची असू शकत नाही."
        );

        return;
      }

      /* ===================================================
         MATERIAL
      =================================================== */

      if (
        selectedMaterials.length ===
        0
      ) {
        alert(
          "किमान एक साहित्य जोडा."
        );

        return;
      }

      /* ===================================================
         ADVANCE
      =================================================== */

      if (
        advanceAmount < 0 ||
        advanceAmount > total
      ) {
        alert(
          "Advance रक्कम योग्य टाका."
        );

        return;
      }

      /* ===================================================
         BOOKING DATA

         IMPORTANT:
         Backend ला materials + advance + adminId
         पाहिजे.
      =================================================== */

      const bookingData = {
        adminId:
          Number(
            currentAdmin.id
          ),

        customer: {
          name:
            customer.name.trim(),

          mobile:
            customer.mobile.trim(),

          address:
            customer.address.trim(),
        },

        bookingDate,

        eventDate,

        materials:
          selectedMaterials.map(
            (item) => ({
              id:
                Number(item.id),

              name:
                item.name,

              quantity:
                Number(
                  item.quantity
                ),

              rate:
                Number(item.rate),
            })
          ),

        advance:
          Number(
            advanceAmount
          ),
      };

      console.log(
        "BOOKING DATA:",
        bookingData
      );

      setSaving(true);
      setSavedBooking(null);

      /* ===================================================
         SAVE
      =================================================== */

      const response =
        await axios.post(
          `${API_URL}/bookings`,
          bookingData
        );

      console.log(
        "BOOKING RESPONSE:",
        response.data
      );

      if (
        response.data?.success
      ) {
        const booking =
          response.data.booking;

        setSavedBooking(
          booking
        );

        alert(
          `बुकिंग यशस्वीपणे सेव्ह झाली!\n\nबुकिंग नंबर: ${formatBookingNumber(
            booking.bookingNumber
          )}\nएकूण बिल: ₹${Number(
            booking.totalAmount || total
          )}\nजमा: ₹${Number(
            booking.advanceAmount ||
              advanceAmount
          )}\nबाकी: ₹${Number(
            booking.remainingAmount ||
              remaining
          )}`
        );
      } else {
        alert(
          response.data?.message ||
            "बुकिंग सेव्ह झाली नाही."
        );
      }
    } catch (error) {
      console.error(
        "Booking save error:",
        error
      );

      console.error(
        "Backend response:",
        error.response?.data
      );

      setSavedBooking(null);

      alert(
        error.response?.data?.message ||
          "बुकिंग सेव्ह करताना error आला."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     DIRECT WHATSAPP
  ======================================================= */

  const handleSendBillWhatsApp =
    () => {
      if (!savedBooking) {
        alert(
          "आधी बुकिंग सेव्ह करा."
        );

        return;
      }

      try {
        setOpeningWhatsApp(
          true
        );

        const mobile =
          String(
            savedBooking.customer
              ?.mobile ||
              customer.mobile ||
              ""
          ).replace(
            /\D/g,
            ""
          );

        if (!mobile) {
          alert(
            "ग्राहकाचा मोबाईल नंबर उपलब्ध नाही."
          );

          return;
        }

        if (mobile.length !== 10) {
          alert(
            "ग्राहकाचा मोबाईल नंबर 10 अंकी असावा."
          );

          return;
        }

        const materialLines =
          selectedMaterials
            .map(
              (item) =>
                `• ${item.name} - ${item.quantity} नग × ₹${item.rate} = ₹${
                  Number(
                    item.quantity
                  ) *
                  Number(
                    item.rate
                  )
                }`
            )
            .join("\n");

        const message =
          `नमस्कार ${
            savedBooking.customer
              ?.name ||
            customer.name ||
            ""
          },\n\n` +
          `आपल्या बुकिंगची माहिती:\n\n` +
          `बुकिंग नंबर: ${formatBookingNumber(
            savedBooking.bookingNumber
          )}\n` +
          `बुकिंग तारीख: ${formatDate(
            bookingDate
          )}\n` +
          `कार्यक्रमाची तारीख: ${formatDate(
            eventDate
          )}\n\n` +
          `साहित्य:\n` +
          `${materialLines}\n\n` +
          `एकूण बिल: ₹${Number(
            savedBooking.totalAmount ||
              total
          )}\n` +
          `जमा रक्कम: ₹${Number(
            savedBooking.advanceAmount ||
              advanceAmount
          )}\n` +
          `बाकी रक्कम: ₹${Number(
            savedBooking.remainingAmount ||
              remaining
          )}\n\n` +
          `धन्यवाद! 🙏\n` +
          `OM SAI CATERERS`;

        const whatsappUrl =
          `https://wa.me/91${mobile}` +
          `?text=${encodeURIComponent(
            message
          )}`;

        window.open(
          whatsappUrl,
          "_blank"
        );
      } catch (error) {
        console.error(
          "WhatsApp error:",
          error
        );

        alert(
          "WhatsApp उघडताना error आला."
        );
      } finally {
        setOpeningWhatsApp(
          false
        );
      }
    };

  /* =======================================================
     BACK
  ======================================================= */

  const handleBack = () => {
    window.history.back();
  };

  /* =======================================================
     LOADING MATERIALS
  ======================================================= */

  if (loadingMaterials) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4">
        <div className="text-center">
          <Loader2
            size={30}
            className="mx-auto animate-spin text-slate-400"
          />

          <p className="mt-3 text-sm text-slate-500">
            साहित्य लोड होत आहे...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f6f7fb] pb-8">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">

        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">

          <div className="flex min-w-0 items-center gap-3">

            <button
              type="button"
              onClick={
                handleBack
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white"
            >
              <ArrowLeft
                size={19}
              />
            </button>

            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-wider text-slate-400">
                OM SAI CATERERS
              </p>

              <h1 className="truncate text-lg font-black text-slate-900">
                नवीन बुकिंग
              </h1>
            </div>

          </div>

          {/* CURRENT ADMIN */}

          {currentAdmin && (
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(
                  "om_sai_selected_admin"
                );

                window.location.href =
                  "/select-admin";
              }}
              className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
              title="Admin बदला"
            >
              <UserRound
                size={15}
              />

              <span className="hidden sm:block">
                {currentAdmin.name}
              </span>
            </button>
          )}

        </div>

      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-4">

        {/* =================================================
            CUSTOMER + DATES
        ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <SectionHeader
            icon={<User size={18} />}
            title="ग्राहक माहिती"
          />

          <div className="mt-4 space-y-3">

            <Input
              label="ग्राहकाचे नाव"
              placeholder="उदा. राहुल पाटील"
              value={
                customer.name
              }
              onChange={(e) =>
                updateCustomer(
                  "name",
                  e.target.value
                )
              }
            />

            <Input
              label="मोबाईल नंबर"
              placeholder="10 अंकी नंबर"
              type="tel"
              maxLength={10}
              icon={
                <Phone size={16} />
              }
              value={
                customer.mobile
              }
              onChange={(e) =>
                updateCustomer(
                  "mobile",
                  e.target.value.replace(
                    /\D/g,
                    ""
                  )
                )
              }
            />

            <Input
              label="पत्ता"
              placeholder="ग्राहकाचा पत्ता"
              icon={
                <MapPin size={16} />
              }
              value={
                customer.address
              }
              onChange={(e) =>
                updateCustomer(
                  "address",
                  e.target.value
                )
              }
            />

          </div>

        </section>

        {/* =================================================
            DATES
        ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <SectionHeader
            icon={
              <CalendarDays
                size={18}
              />
            }
            title="तारीख"
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2">

            <Input
              label="बुकिंग तारीख"
              type="date"
              value={
                bookingDate
              }
              onChange={(e) =>
                handleBookingDateChange(
                  e.target.value
                )
              }
            />

            <Input
              label="कार्यक्रम तारीख"
              type="date"
              min={
                bookingDate ||
                undefined
              }
              value={
                eventDate
              }
              onChange={(e) =>
                handleEventDateChange(
                  e.target.value
                )
              }
            />

          </div>

        </section>

        {/* =================================================
            MATERIAL
        ================================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <SectionHeader
            icon={
              <Package size={18} />
            }
            title="साहित्य"
          />

          {/* ADD MATERIAL */}

          <div className="mt-4 rounded-xl bg-slate-50 p-3">

            <select
              value={
                selectedMaterialId
              }
              onChange={(e) =>
                setSelectedMaterialId(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-900"
            >
              <option value="">
                साहित्य निवडा
              </option>

              {materials.map(
                (material) => (
                  <option
                    key={
                      material.id
                    }
                    value={
                      material.id
                    }
                  >
                    {material.name} — ₹
                    {material.rate} — उपलब्ध{" "}
                    {material.stock}
                  </option>
                )
              )}
            </select>

            <div className="mt-2 flex gap-2">

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    e.target.value
                  )
                }
                className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-3 text-center font-bold outline-none focus:border-slate-900"
              />

              <button
                type="button"
                onClick={
                  addMaterial
                }
                disabled={
                  !selectedMaterialId
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-bold text-white disabled:opacity-40"
              >
                <Plus
                  size={18}
                />

                साहित्य जोडा
              </button>

            </div>

          </div>

          {/* MATERIAL LIST */}

          {selectedMaterials.length ===
          0 ? (
            <div className="mt-3 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-400">
              अजून साहित्य जोडलेले नाही.
            </div>
          ) : (
            <div className="mt-3 space-y-2">

              {selectedMaterials.map(
                (item) => {
                  const amount =
                    Number(
                      item.quantity
                    ) *
                    Number(
                      item.rate
                    );

                  return (
                    <div
                      key={
                        item.id
                      }
                      className="rounded-xl border border-slate-200 bg-white p-3"
                    >

                      <div className="flex items-center justify-between gap-3">

                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">
                            {item.name}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            ₹{item.rate} / नग
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeMaterial(
                              item.id
                            )
                          }
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        >
                          <Trash2
                            size={17}
                          />
                        </button>

                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">

                        <div className="flex items-center gap-2">

                          <span className="text-xs text-slate-400">
                            नग
                          </span>

                          <input
                            type="number"
                            min="1"
                            max={
                              item.stock
                            }
                            value={
                              item.quantity
                            }
                            onChange={(
                              e
                            ) =>
                              updateQuantity(
                                item.id,
                                e.target
                                  .value
                              )
                            }
                            className="w-20 rounded-lg border border-slate-200 px-2 py-2 text-center font-bold outline-none"
                          />

                          <span className="text-[11px] text-slate-400">
                            / {item.stock}
                          </span>

                        </div>

                        <p className="font-black text-slate-900">
                          ₹{amount}
                        </p>

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

          {/* MATERIAL TOTAL */}

          {selectedMaterials.length >
            0 && (
            <div className="mt-3 rounded-xl bg-slate-100 p-3">

              <div className="flex justify-between text-xs text-slate-500">
                <span>
                  प्रकार
                </span>

                <span className="font-bold text-slate-800">
                  {
                    selectedMaterials.length
                  }
                </span>
              </div>

              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>
                  एकूण नग
                </span>

                <span className="font-bold text-slate-800">
                  {totalQuantity}
                </span>
              </div>

              <div className="mt-3 flex justify-between border-t border-slate-200 pt-3">
                <span className="font-bold text-slate-700">
                  एकूण
                </span>

                <span className="text-lg font-black text-slate-900">
                  ₹{total}
                </span>
              </div>

            </div>
          )}

        </section>

        {/* =================================================
            PAYMENT
        ================================================= */}

        <section className="rounded-2xl bg-slate-900 p-4 text-white shadow-lg">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <IndianRupee
                size={19}
              />
            </div>

            <div>
              <h2 className="font-bold">
                पेमेंट
              </h2>

              <p className="text-xs text-slate-400">
                बिल आणि जमा
              </p>
            </div>

          </div>

          <div className="mt-4 space-y-3">

            <div className="flex justify-between">
              <span className="text-sm text-slate-300">
                एकूण बिल
              </span>

              <span className="font-black">
                ₹{total}
              </span>
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-slate-300">
                Advance / जमा
              </label>

              <input
                type="number"
                min="0"
                max={total}
                value={
                  advance
                }
                onChange={(e) => {
                  const value =
                    Number(
                      e.target.value
                    );

                  if (
                    value <= total
                  ) {
                    setAdvance(
                      e.target.value
                    );

                    setSavedBooking(
                      null
                    );
                  }
                }}
                placeholder="₹ 0"
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
              <span className="text-sm text-slate-300">
                स्थिती
              </span>

              <PaymentBadge
                status={
                  paymentStatus
                }
              />
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-sm text-slate-300">
                बाकी
              </span>

              <span className="text-xl font-black">
                ₹{remaining}
              </span>
            </div>

          </div>

        </section>

        {/* =================================================
            SAVE
        ================================================= */}

        <button
          type="button"
          onClick={
            handleSaveBooking
          }
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2
                size={19}
                className="animate-spin"
              />

              बुकिंग सेव्ह होत आहे...
            </>
          ) : (
            <>
              <CheckCircle2
                size={19}
              />

              बुकिंग सेव्ह करा
            </>
          )}
        </button>

        {/* =================================================
            WHATSAPP
        ================================================= */}

        {savedBooking && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <MessageCircle
                  size={19}
                />
              </div>

              <div>

                <h3 className="font-bold text-emerald-900">
                  बुकिंग सेव्ह झाली ✅
                </h3>

                <p className="mt-1 text-xs text-emerald-700">
                  Booking No:{" "}
                  <b>
                    {formatBookingNumber(
                      savedBooking.bookingNumber
                    )}
                  </b>
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={
                handleSendBillWhatsApp
              }
              disabled={
                openingWhatsApp
              }
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >

              {openingWhatsApp ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  WhatsApp उघडत आहे...
                </>
              ) : (
                <>
                  <MessageCircle
                    size={18}
                  />

                  ग्राहकाचा WhatsApp उघडा
                </>
              )}

            </button>

            <p className="mt-2 text-center text-[11px] text-emerald-700">
              ग्राहकाच्या saved number वर direct chat उघडेल.
            </p>

          </section>
        )}

      </main>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  title,
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        {icon}
      </div>

      <h2 className="font-black text-slate-900">
        {title}
      </h2>

    </div>
  );
}

/* =========================================================
   INPUT
========================================================= */

function Input({
  label,
  placeholder,
  type = "text",
  icon,
  value,
  onChange,
  maxLength,
  min,
}) {
  return (
    <div>

      <label className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}
      </label>

      <div className="relative">

        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}

        <input
          type={type}
          placeholder={
            placeholder
          }
          value={value}
          onChange={onChange}
          maxLength={
            maxLength
          }
          min={min}
          className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100 ${
            icon
              ? "pl-10"
              : ""
          }`}
        />

      </div>

    </div>
  );
}

/* =========================================================
   PAYMENT BADGE
========================================================= */

function PaymentBadge({
  status,
}) {
  if (
    status === "PAID"
  ) {
    return (
      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
        पूर्ण
      </span>
    );
  }

  if (
    status === "PARTIAL"
  ) {
    return (
      <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300">
        अंशतः
      </span>
    );
  }

  return (
    <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-300">
      बाकी
    </span>
  );
}

export default NewBooking;