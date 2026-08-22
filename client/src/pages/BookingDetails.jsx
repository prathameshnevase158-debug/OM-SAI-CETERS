import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  ArrowLeft,
  CalendarDays,
  User,
  Phone,
  Package,
  RefreshCw,
  CheckCircle2,
  Clock3,
  Hash,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  Save,
  X,
  Loader2,
} from "lucide-react";

const API_URL = "http://10.42.240.226:5000/api";

function BookingDetails() {
  const [booking, setBooking] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [sendingBill, setSendingBill] = useState(false);
  const [showWhatsAppAfterEdit, setShowWhatsAppAfterEdit] = useState(false);

  const [editing, setEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    mobile: "",
    address: "",
    bookingDate: "",
    eventDate: "",
    advance: "",
    items: [],
  });

  const [selectedMaterialId, setSelectedMaterialId] =
    useState("");

  const [newQuantity, setNewQuantity] = useState(1);

  /* =====================================================
     GET BOOKING ID
  ===================================================== */

  const getBookingId = () => {
    const path = window.location.pathname;

    const parts = path
      .split("/")
      .filter(Boolean);

    return parts[parts.length - 1];
  };

  /* =====================================================
     FETCH BOOKING
  ===================================================== */

  const fetchBooking = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const bookingId = getBookingId();

      if (
        !bookingId ||
        Number.isNaN(Number(bookingId))
      ) {
        throw new Error("Invalid booking ID.");
      }
console.time("BOOKING API");

const response = await axios.get(
  `${API_URL}/bookings/${bookingId}`
);

console.timeEnd("BOOKING API");

      if (response.data?.success) {
        setBooking(response.data.booking);
      } else {
        throw new Error(
          response.data?.message ||
            "Booking मिळाली नाही."
        );
      }
    } catch (error) {
      console.error(
        "Booking details error:",
        error
      );

      alert(
        error.response?.data?.message ||
          error.message ||
          "Booking माहिती मिळवताना error आला."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, []);

  /* =====================================================
     FETCH MATERIALS
  ===================================================== */

  const fetchMaterials = async () => {
    try {
      setLoadingMaterials(true);

     console.time("MATERIALS API");

const response = await axios.get(
  `${API_URL}/materials`
);

console.timeEnd("MATERIALS API");

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
          "Materials मिळवताना error आला."
      );
    } finally {
      setLoadingMaterials(false);
    }
  };

  /* =====================================================
     DATE FORMAT
  ===================================================== */

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "-";
    }

    return parsedDate.toLocaleDateString(
      "mr-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  const formatDateForInput = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "";
    }

    const year =
      parsedDate.getFullYear();

    const month = String(
      parsedDate.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      parsedDate.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  /* =====================================================
     BACK
  ===================================================== */

const goBack = () => {
  window.history.back();
};


  /* =====================================================
     PAYMENT STATUS
  ===================================================== */

  const getPaymentStatus = () => {
    if (!booking) return null;

    if (
      booking.paymentStatus ===
      "PAID"
    ) {
      return {
        label: "पूर्ण Payment",
        className:
          "bg-green-100 text-green-700",
        icon: CheckCircle2,
      };
    }

    if (
      booking.paymentStatus ===
      "PARTIAL"
    ) {
      return {
        label: "Partial Payment",
        className:
          "bg-orange-100 text-orange-700",
        icon: Clock3,
      };
    }

    return {
      label: "Payment बाकी",
      className:
        "bg-red-100 text-red-700",
      icon: Clock3,
    };
  };

  /* =====================================================
     START EDIT
  ===================================================== */

  const startEditing = async () => {
    if (!booking) return;

    setEditForm({
      name:
        booking.customer?.name || "",

      mobile:
        booking.customer?.mobile || "",

      address:
        booking.customer?.address || "",

      bookingDate:
        formatDateForInput(
          booking.bookingDate
        ),

      eventDate:
        formatDateForInput(
          booking.eventDate
        ),

      advance: String(
        booking.advanceAmount || 0
      ),

      items:
        (booking.items || []).map(
          (item) => ({
            id: item.id,

            materialId: Number(
              item.materialId ||
                item.material?.id
            ),

            name:
              item.material?.name ||
              "Material",

            quantity: Number(
              item.quantity || 0
            ),

            rate: Number(
              item.rate || 0
            ),

            stock: Number(
              item.material?.stock || 0
            ),

            returnedQuantity:
              Number(
                item.returnedQuantity ||
                  0
              ),

            missingQuantity:
              Number(
                item.missingQuantity ||
                  0
              ),
          })
        ),
    });

    setSelectedMaterialId("");
    setNewQuantity(1);
    setEditing(true);

    await fetchMaterials();
  };

  /* =====================================================
     CANCEL EDIT
  ===================================================== */

  const cancelEditing = () => {
    setEditing(false);

    setSelectedMaterialId("");
    setNewQuantity(1);
  };

  /* =====================================================
     UPDATE EDIT FIELD
  ===================================================== */

  const updateEditField = (
    field,
    value
  ) => {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /* =====================================================
     SELECTED NEW MATERIAL
  ===================================================== */

  const selectedNewMaterial =
    useMemo(() => {
      return materials.find(
        (item) =>
          Number(item.id) ===
          Number(selectedMaterialId)
      );
    }, [
      materials,
      selectedMaterialId,
    ]);

  /* =====================================================
     ADD NEW MATERIAL
  ===================================================== */

  const addMaterialToEdit = () => {
    if (!selectedMaterialId) {
      alert("कृपया साहित्य निवडा.");
      return;
    }

    if (!selectedNewMaterial) {
      alert(
        "साहित्य सापडले नाही."
      );
      return;
    }

    const quantity =
      Number(newQuantity);

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      alert(
        "कृपया योग्य quantity टाका."
      );
      return;
    }

    if (
      quantity >
      Number(
        selectedNewMaterial.stock || 0
      )
    ) {
      alert(
        `${selectedNewMaterial.name} फक्त ${selectedNewMaterial.stock} नग उपलब्ध आहेत.`
      );
      return;
    }

    const alreadyExists =
      editForm.items.some(
        (item) =>
          Number(item.materialId) ===
          Number(
            selectedNewMaterial.id
          )
      );

    if (alreadyExists) {
      alert(
        "हे साहित्य आधीच booking मध्ये आहे. खाली त्याची quantity बदला."
      );
      return;
    }

    setEditForm((current) => ({
      ...current,

      items: [
        ...current.items,

        {
          id: null,

          materialId:
            Number(
              selectedNewMaterial.id
            ),

          name:
            selectedNewMaterial.name,

          quantity,

          rate: Number(
            selectedNewMaterial.rate ||
              0
          ),

          stock: Number(
            selectedNewMaterial.stock ||
              0
          ),

          returnedQuantity: 0,

          missingQuantity: 0,
        },
      ],
    }));

    setSelectedMaterialId("");
    setNewQuantity(1);
  };

  /* =====================================================
     EDITABLE STOCK
  ===================================================== */

  const getEditableStock = (
    item
  ) => {
    const currentStock =
      Number(
        item.stock || 0
      );

    const heldQuantity =
      Math.max(
        Number(
          item.quantity || 0
        ) -
          Number(
            item.returnedQuantity || 0
          ) -
          Number(
            item.missingQuantity || 0
          ),
        0
      );

    return (
      currentStock +
      heldQuantity
    );
  };

  /* =====================================================
     UPDATE MATERIAL QUANTITY
  ===================================================== */

  const updateEditQuantity = (
    materialId,
    value
  ) => {
    let quantity =
      Number(value);

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      quantity = 1;
    }

    setEditForm((current) => ({
      ...current,

      items:
        current.items.map(
          (item) => {
            if (
              Number(
                item.materialId
              ) !==
              Number(materialId)
            ) {
              return item;
            }

            const maxQuantity =
              getEditableStock(
                item
              );

            if (
              quantity >
              maxQuantity
            ) {
              alert(
                `${item.name} साठी maximum ${maxQuantity} नग ठेवता येतील.`
              );

              return {
                ...item,
                quantity:
                  maxQuantity,
              };
            }

            const minimumQuantity =
              Number(
                item.returnedQuantity ||
                  0
              ) +
              Number(
                item.missingQuantity ||
                  0
              );

            if (
              quantity <
              minimumQuantity
            ) {
              alert(
                `${item.name} ची quantity ${minimumQuantity} पेक्षा कमी करता येणार नाही.`
              );

              return {
                ...item,
                quantity:
                  minimumQuantity,
              };
            }

            return {
              ...item,
              quantity,
            };
          }
        ),
    }));
  };

  /* =====================================================
     REMOVE MATERIAL
  ===================================================== */

  const removeEditMaterial = (
    materialId
  ) => {
    const target =
      editForm.items.find(
        (item) =>
          Number(
            item.materialId
          ) ===
          Number(materialId)
      );

    if (!target) return;

    const alreadyReturnedOrMissing =
      Number(
        target.returnedQuantity ||
          0
      ) +
      Number(
        target.missingQuantity ||
          0
      );

    if (
      alreadyReturnedOrMissing > 0
    ) {
      alert(
        `${target.name} मध्ये returned/missing quantity आहे. हे material remove करता येणार नाही.`
      );

      return;
    }

    setEditForm((current) => ({
      ...current,

      items:
        current.items.filter(
          (item) =>
            Number(
              item.materialId
            ) !==
            Number(materialId)
        ),
    }));
  };

  /* =====================================================
     TOTALS
  ===================================================== */

  const editTotal =
    useMemo(() => {
      return editForm.items.reduce(
        (sum, item) =>
          sum +
          Number(
            item.quantity || 0
          ) *
            Number(
              item.rate || 0
            ),
        0
      );
    }, [editForm.items]);

  const editTotalQuantity =
    useMemo(() => {
      return editForm.items.reduce(
        (sum, item) =>
          sum +
          Number(
            item.quantity || 0
          ),
        0
      );
    }, [editForm.items]);

  const editAdvance =
    Number(
      editForm.advance || 0
    );

  const editRemaining =
    Math.max(
      editTotal -
        editAdvance,
      0
    );

  const editPaymentStatus =
    editTotal === 0
      ? "PENDING"
      : editAdvance >=
        editTotal
      ? "PAID"
      : editAdvance > 0
      ? "PARTIAL"
      : "PENDING";

  /* =====================================================
     SAVE EDIT
  ===================================================== */

  const saveEditing =
    async () => {
      try {
        if (
          !editForm.name.trim()
        ) {
          alert(
            "कृपया ग्राहकाचे नाव टाका."
          );
          return;
        }

        if (
          !editForm.mobile.trim()
        ) {
          alert(
            "कृपया मोबाईल नंबर टाका."
          );
          return;
        }

        if (
          editForm.mobile.length !==
          10
        ) {
          alert(
            "मोबाईल नंबर 10 अंकी असावा."
          );
          return;
        }

        if (
          !editForm.bookingDate
        ) {
          alert(
            "कृपया booking date निवडा."
          );
          return;
        }

        if (
          !editForm.eventDate
        ) {
          alert(
            "कृपया event date निवडा."
          );
          return;
        }

        if (
          editForm.eventDate <
          editForm.bookingDate
        ) {
          alert(
            "Event date booking date पेक्षा आधीची असू शकत नाही."
          );
          return;
        }

        if (
          editForm.items.length ===
          0
        ) {
          alert(
            "कमीत कमी एक साहित्य असणे आवश्यक आहे."
          );
          return;
        }

        if (
          editAdvance < 0
        ) {
          alert(
            "Advance योग्य टाका."
          );
          return;
        }

        if (
          editAdvance >
          editTotal
        ) {
          alert(
            "Advance एकूण बिलापेक्षा जास्त असू शकत नाही."
          );
          return;
        }

        const bookingId =
          getBookingId();

        const updateData = {
          customer: {
            name:
              editForm.name.trim(),

            mobile:
              editForm.mobile.trim(),

            address:
              editForm.address.trim(),
          },

          bookingDate:
            editForm.bookingDate,

          eventDate:
            editForm.eventDate,

          /* IMPORTANT:
             Backend ला materials पाहिजे */

          materials:
            editForm.items.map(
              (item) => ({
                ...(item.id
                  ? {
                      bookingItemId:
                        Number(
                          item.id
                        ),
                    }
                  : {}),

                materialId:
                  Number(
                    item.materialId
                  ),

                quantity:
                  Number(
                    item.quantity
                  ),

                rate:
                  Number(
                    item.rate
                  ),
              })
            ),

          advance:
            Number(
              editAdvance
            ),
        };

        console.log(
          "UPDATE BOOKING PAYLOAD:",
          updateData
        );

        setSavingEdit(true);

        const response =
          await axios.put(
            `${API_URL}/bookings/${bookingId}`,
            updateData
          );

        if (
          response.data?.success
        ) {
          setEditing(false);
          setShowWhatsAppAfterEdit(true);

          await fetchBooking();

          alert(
            "Booking successfully update झाली."
          );
        } else {
          alert(
            response.data?.message ||
              "Booking update झाली नाही."
          );
        }
      } catch (error) {
        console.error(
          "Update booking error:",
          error
        );

        console.error(
          "Backend response:",
          error.response?.data
        );

        alert(
          error.response?.data
            ?.message ||
            "Booking update करताना error आला."
        );
      } finally {
        setSavingEdit(false);
      }
    };

  


  /* =====================================================
     SEND BILL ON WHATSAPP
     Direct WhatsApp flow - Meta API नाही
  ===================================================== */

  const sendBill = () => {
    if (!booking) {
      alert("Booking उपलब्ध नाही.");
      return;
    }

    const mobile = String(
      booking.customer?.mobile || ""
    ).replace(/\D/g, "");

    if (!mobile) {
      alert("ग्राहकाचा मोबाईल नंबर उपलब्ध नाही.");
      return;
    }

    if (mobile.length !== 10) {
      alert("ग्राहकाचा मोबाईल नंबर 10 अंकी असणे आवश्यक आहे.");
      return;
    }

    const message =
      `नमस्कार ${booking.customer?.name || ""},\n\n` +
      `आपल्या बुकिंगचे बिल:\n\n` +
      `बुकिंग नंबर: ${
        booking.bookingNumber || `#${booking.id || ""}`
      }\n` +
      `कार्यक्रमाची तारीख: ${formatDate(booking.eventDate)}\n\n` +
      `एकूण बिल: ₹${Number(booking.totalAmount || 0)}\n` +
      `जमा रक्कम: ₹${Number(booking.advanceAmount || 0)}\n` +
      `बाकी रक्कम: ₹${Number(booking.remainingAmount || 0)}\n\n` +
      `धन्यवाद! 🙏\n` +
      `OM SAI CETERS`;

    const whatsappUrl =
      `https://wa.me/91${mobile}` +
      `?text=${encodeURIComponent(message)}`;

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* =====================================================
     MAIN UI
  ===================================================== */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4">
        <div className="text-center">
          <RefreshCw
            size={30}
            className="mx-auto animate-spin text-slate-400"
          />
          <p className="mt-3 text-sm text-slate-500">
            Booking माहिती लोड होत आहे...
          </p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Package
            size={40}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-4 text-lg font-black text-slate-900">
            Booking सापडली नाही
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            ही booking उपलब्ध नाही किंवा delete झाली आहे.
          </p>

          <button
            type="button"
            onClick={goBack}
            className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
          >
            मागे जा
          </button>
        </div>
      </div>
    );
  }

  const paymentStatus = getPaymentStatus();
  const PaymentIcon = paymentStatus?.icon || Clock3;

  return (
    <div className="min-h-screen bg-[#f6f7fb] pb-10">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm active:scale-95"
            >
              <ArrowLeft size={18} />
              <span>मागे</span>
            </button>

            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400">
                OM SAI CETERS
              </p>
              <h1 className="truncate text-lg font-black text-slate-900">
                Booking Details
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!editing && (
              <button
                type="button"
                onClick={startEditing}
                className="flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-3 text-sm font-bold text-white"
              >
                <Pencil size={16} />
                <span className="hidden sm:block">Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fetchBooking(true)}
              disabled={refreshing}
              className="flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-bold text-white disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              <span className="hidden sm:block">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-4 py-4">
        {editing ? (
          <EditBookingPanel
            editForm={editForm}
            updateEditField={updateEditField}
            materials={materials}
            loadingMaterials={loadingMaterials}
            selectedMaterialId={selectedMaterialId}
            setSelectedMaterialId={setSelectedMaterialId}
            newQuantity={newQuantity}
            setNewQuantity={setNewQuantity}
            selectedNewMaterial={selectedNewMaterial}
            addMaterialToEdit={addMaterialToEdit}
            updateEditQuantity={updateEditQuantity}
            removeEditMaterial={removeEditMaterial}
            getEditableStock={getEditableStock}
            editTotal={editTotal}
            editTotalQuantity={editTotalQuantity}
            editRemaining={editRemaining}
            editPaymentStatus={editPaymentStatus}
            saveEditing={saveEditing}
            cancelEditing={cancelEditing}
            savingEdit={savingEdit}
          />
        ) : (
          <>
            {/* BOOKING HEADER */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Hash size={15} className="text-slate-400" />
                    <p className="text-sm font-bold text-slate-500">
                      {booking.bookingNumber || `#${booking.id}`}
                    </p>
                  </div>

                  <h2 className="mt-1 truncate text-xl font-black text-slate-900">
                    {booking.customer?.name || "-"}
                  </h2>
                </div>

                <div
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ${paymentStatus.className}`}
                >
                  <div className="flex items-center gap-1.5">
                    <PaymentIcon size={14} />
                    {paymentStatus.label}
                  </div>
                </div>
              </div>
            </section>

            {/* BILL SUMMARY */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400">
                    एकूण बिल
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-900">
                    ₹{Number(booking.totalAmount || 0)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400">बाकी</p>
                  <p className="mt-1 text-xl font-black text-orange-600">
                    ₹{Number(booking.remainingAmount || 0)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-400">Advance</p>
                  <p className="mt-1 font-black">
                    ₹{Number(booking.advanceAmount || 0)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-400">
                    Total Quantity
                  </p>
                  <p className="mt-1 font-black">
                    {Number(booking.totalQuantity || 0)} नग
                  </p>
                </div>
              </div>

              {showWhatsAppAfterEdit && (
                <>
                  <button
                    type="button"
                    onClick={sendBill}
                    disabled={sendingBill}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-sm font-black text-white disabled:opacity-60"
                  >
                    {sendingBill ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Bill WhatsApp साठी तयार करत आहे...
                      </>
                    ) : (
                      <>
                        <MessageCircle size={18} />
                        Bill WhatsApp वर पाठवा
                      </>
                    )}
                  </button>

                  <p className="mt-2 text-center text-xs text-slate-400">
                    Edit केल्यानंतर updated bill WhatsApp वर पाठवा.
                  </p>
                </>
              )}
            </section>

            {/* CUSTOMER */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                  <User size={18} />
                </div>

                <div>
                  <h2 className="font-black text-slate-900">Customer</h2>
                  <p className="text-xs text-slate-400">
                    ग्राहकाची माहिती
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <SimpleInfo
                  label="नाव"
                  value={booking.customer?.name || "-"}
                />

                <SimpleInfo
                  label="मोबाईल"
                  value={booking.customer?.mobile || "-"}
                  icon={<Phone size={14} />}
                />

                {booking.customer?.address && (
                  <SimpleInfo
                    label="पत्ता"
                    value={booking.customer.address}
                  />
                )}
              </div>
            </section>

            {/* DATES */}
            <section className="grid grid-cols-2 gap-3">
              <InfoCard
                icon={<CalendarDays size={18} />}
                title="Booking Date"
                value={formatDate(booking.bookingDate)}
              />

              <InfoCard
                icon={<CalendarDays size={18} />}
                title="Event Date"
                value={formatDate(booking.eventDate)}
                highlight
              />
            </section>

            {/* MATERIALS */}
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                  <Package size={18} />
                </div>

                <div>
                  <h2 className="font-black text-slate-900">
                    Book केलेले साहित्य
                  </h2>
                  <p className="text-xs text-slate-400">
                    {booking.items?.length || 0} प्रकार
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {booking.items?.length ? (
                  booking.items.map((item, index) => {
                    const quantity = Number(item.quantity || 0);
                    const rate = Number(item.rate || 0);
                    const amount = Number(
                      item.amount ?? quantity * rate
                    );

                    return (
                      <div
                        key={item.id || index}
                        className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900">
                            {item.material?.name || "Material"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {quantity} नग × ₹{rate}
                          </p>
                        </div>

                        <p className="shrink-0 text-sm font-black">
                          ₹{amount}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-400">
                    साहित्य उपलब्ध नाही.
                  </p>
                )}
              </div>
            </section>

            {/* STATUS */}
            <section className="grid grid-cols-2 gap-3">
              <InfoCard
                icon={<Package size={18} />}
                title="Total Quantity"
                value={`${Number(booking.totalQuantity || 0)} नग`}
              />

              <InfoCard
                icon={<CheckCircle2 size={18} />}
                title="Status"
                value={
                  booking.bookingStatus === "ACTIVE"
                    ? "Active"
                    : booking.bookingStatus || "-"
                }
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
/* =====================================================
   EDIT BOOKING PANEL
===================================================== */

function EditBookingPanel({
  editForm,
  updateEditField,
  materials,
  loadingMaterials,
  selectedMaterialId,
  setSelectedMaterialId,
  newQuantity,
  setNewQuantity,
  selectedNewMaterial,
  addMaterialToEdit,
  updateEditQuantity,
  removeEditMaterial,
  getEditableStock,
  editTotal,
  editTotalQuantity,
  editRemaining,
  editPaymentStatus,
  saveEditing,
  cancelEditing,
  savingEdit,
}) {
  return (
    <section className="rounded-2xl border border-orange-200 bg-white p-4 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-lg font-black text-slate-900">
            Booking Edit करा
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Customer, date, material आणि payment बदलू शकता.
          </p>

        </div>

        <button
          type="button"
          onClick={cancelEditing}
          disabled={savingEdit}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
        >
          <X size={18} />
        </button>

      </div>

      {/* CUSTOMER */}

      <div className="mt-5">

        <p className="mb-3 text-sm font-black text-slate-800">
          Customer
        </p>

        <div className="space-y-3">

          <EditInput
            label="नाव"
            value={editForm.name}
            onChange={(e) =>
              updateEditField(
                "name",
                e.target.value
              )
            }
          />

          <EditInput
            label="मोबाईल"
            value={editForm.mobile}
            maxLength={10}
            onChange={(e) =>
              updateEditField(
                "mobile",
                e.target.value.replace(
                  /\D/g,
                  ""
                )
              )
            }
          />

          <EditInput
            label="पत्ता"
            value={editForm.address}
            onChange={(e) =>
              updateEditField(
                "address",
                e.target.value
              )
            }
          />

        </div>

      </div>

      {/* DATES */}

      <div className="mt-5">

        <p className="mb-3 text-sm font-black text-slate-800">
          Dates
        </p>

        <div className="grid gap-3 sm:grid-cols-2">

          <EditInput
            label="Booking Date"
            type="date"
            value={
              editForm.bookingDate
            }
            onChange={(e) =>
              updateEditField(
                "bookingDate",
                e.target.value
              )
            }
          />

          <EditInput
            label="Event Date"
            type="date"
            min={
              editForm.bookingDate
            }
            value={
              editForm.eventDate
            }
            onChange={(e) =>
              updateEditField(
                "eventDate",
                e.target.value
              )
            }
          />

        </div>

      </div>

      {/* ADD MATERIAL */}

      <div className="mt-5 rounded-xl bg-slate-50 p-3">

        <p className="mb-3 text-sm font-black text-slate-800">
          Extra साहित्य जोडा
        </p>

        {loadingMaterials ? (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-400">

            <Loader2
              size={18}
              className="animate-spin"
            />

            Materials लोड होत आहेत...

          </div>
        ) : (
          <>

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
                    key={material.id}
                    value={
                      material.id
                    }
                  >
                    {material.name} — ₹
                    {material.rate} — Stock{" "}
                    {material.stock}
                  </option>
                )
              )}

            </select>

            <div className="mt-2 flex gap-2">

              <input
                type="number"
                min="1"
                value={
                  newQuantity
                }
                onChange={(e) =>
                  setNewQuantity(
                    e.target.value
                  )
                }
                className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-sm font-bold outline-none"
              />

              <button
                type="button"
                onClick={
                  addMaterialToEdit
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 text-sm font-bold text-white"
              >

                <Plus size={17} />

                साहित्य जोडा

              </button>

            </div>

            {selectedNewMaterial && (
              <p className="mt-2 text-xs text-slate-400">
                उपलब्ध:{" "}
                {
                  selectedNewMaterial.stock
                }{" "}
                नग
              </p>
            )}

          </>
        )}

      </div>

      {/* MATERIAL LIST */}

      <div className="mt-5">

        <p className="mb-3 text-sm font-black text-slate-800">
          Booking मधील साहित्य
        </p>

        <div className="space-y-2">

          {editForm.items.map(
            (item) => {

              const amount =
                Number(
                  item.quantity || 0
                ) *
                Number(
                  item.rate || 0
                );

              const maxQuantity =
                getEditableStock(
                  item
                );

              const minimumQuantity =
                Number(
                  item.returnedQuantity ||
                    0
                ) +
                Number(
                  item.missingQuantity ||
                    0
                );

              return (
                <div
                  key={
                    item.materialId
                  }
                  className="rounded-xl border border-slate-200 p-3"
                >

                  <div className="flex items-center justify-between gap-3">

                    <div className="min-w-0">

                      <p className="truncate text-sm font-black text-slate-900">
                        {item.name}
                      </p>

                      <p className="text-xs text-slate-400">
                        ₹{item.rate} / नग
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeEditMaterial(
                          item.materialId
                        )
                      }
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2
                        size={17}
                      />
                    </button>

                  </div>

                  <div className="mt-3 flex items-center gap-2">

                    <input
                      type="number"
                      min={
                        minimumQuantity ||
                        1
                      }
                      max={
                        maxQuantity
                      }
                      value={
                        item.quantity
                      }
                      onChange={(e) =>
                        updateEditQuantity(
                          item.materialId,
                          e.target.value
                        )
                      }
                      className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-center font-bold outline-none"
                    />

                    <div className="flex-1 text-right">

                      <p className="text-xs text-slate-400">
                        Amount
                      </p>

                      <p className="font-black">
                        ₹{amount}
                      </p>

                    </div>

                  </div>

                  {minimumQuantity >
                    0 && (
                    <p className="mt-2 text-[11px] text-orange-600">
                      Minimum quantity:{" "}
                      {
                        minimumQuantity
                      }
                    </p>
                  )}

                </div>
              );
            }
          )}

        </div>

      </div>

      {/* PAYMENT */}

      <div className="mt-5 rounded-xl bg-slate-900 p-4 text-white">

        <div className="flex justify-between">

          <span className="text-sm text-slate-300">
            एकूण बिल
          </span>

          <span className="font-black">
            ₹{editTotal}
          </span>

        </div>

        <div className="mt-3">

          <label className="mb-2 block text-sm text-slate-300">
            Advance
          </label>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={editForm.advance}
            onChange={(e) =>
              updateEditField(
                "advance",
                e.target.value.replace(/\D/g, "")
              )
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter" ||
                e.key === "ArrowUp" ||
                e.key === "ArrowDown"
              ) {
                e.preventDefault();
              }
            }}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none focus:border-white/30"
            autoComplete="off"
          />

        </div>

        <div className="mt-3 flex justify-between border-t border-white/10 pt-3">

          <span className="text-slate-300">
            बाकी
          </span>

          <span className="text-xl font-black">
            ₹{editRemaining}
          </span>

        </div>

        <div className="mt-2 text-right text-xs text-slate-400">
          {editPaymentStatus}
        </div>

        <div className="mt-2 text-right text-xs text-slate-400">
          Total Quantity:{" "}
          {editTotalQuantity} नग
        </div>

      </div>

      {/* BUTTONS */}

      <div className="mt-5 grid grid-cols-2 gap-2">

        <button
          type="button"
          onClick={
            cancelEditing
          }
          disabled={savingEdit}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700"
        >

          <X size={17} />

          Cancel

        </button>

        <button
          type="button"
          onClick={saveEditing}
          disabled={savingEdit}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white disabled:opacity-60"
        >

          {savingEdit ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />

              Saving...
            </>
          ) : (
            <>
              <Save size={18} />

              Save Changes
            </>
          )}

        </button>

      </div>

    </section>
  );
}

/* =====================================================
   EDIT INPUT
===================================================== */

function EditInput({
  label,
  value,
  onChange,
  type = "text",
  maxLength,
}) {
  return (
    <div>

      <label className="mb-1.5 block text-xs font-bold text-slate-500">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-900"
      />

    </div>
  );
}

/* =====================================================
   SIMPLE INFO
===================================================== */

function SimpleInfo({
  label,
  value,
  icon,
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">

      <div className="flex items-center gap-2">

        {icon && (
          <span className="text-slate-400">
            {icon}
          </span>
        )}

        <span className="text-xs font-semibold text-slate-400">
          {label}
        </span>

      </div>

      <span className="text-right text-sm font-bold text-slate-900">
        {value}
      </span>

    </div>
  );
}

/* =====================================================
   INFO CARD
===================================================== */

function InfoCard({
  icon,
  title,
  value,
  highlight = false,
}) {
  return (
    <div
      className={`rounded-2xl border p-3 ${
        highlight
          ? "border-orange-200 bg-orange-50"
          : "border-slate-200 bg-white"
      }`}
    >

      <div className="flex items-center gap-2">

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
          {icon}
        </div>

        <div className="min-w-0">

          <p className="text-[11px] font-semibold text-slate-400">
            {title}
          </p>

          <p className="mt-1 truncate text-sm font-black text-slate-900">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}

export default BookingDetails;