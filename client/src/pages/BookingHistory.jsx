import {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";
const API_URL = "https://om-sai-ceters-server.onrender.com/api";

import {
  ArrowLeft,
  Search,
  RefreshCw,
  Eye,
  Phone,
  CalendarDays,
  IndianRupee,
  Package,
  User,
  X,
  CheckCircle2,
  Trash2,
  Pencil,
  Save,
  Truck,
  RotateCcw,
  Users,
} from "lucide-react";

/* =====================================================
   API
===================================================== */

// const API_URL =
//   "https://om-sai-ceters-server.onrender.com/api/bookings";

const MATERIAL_API_URL =
  "https://om-sai-ceters-server.onrender.com/api/materials";

const ADMIN_STORAGE_KEY =
  "om_sai_selected_admin";

/* =====================================================
   CURRENT ADMIN
===================================================== */

const getCurrentAdmin = () => {
  try {
    const saved =
      localStorage.getItem(
        ADMIN_STORAGE_KEY
      );

    if (!saved) {
      return null;
    }

    const parsed =
      JSON.parse(saved);

    if (!parsed?.id) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error(
      "Current admin read error:",
      error
    );

    return null;
  }
};

/* =====================================================
   BOOKING HISTORY
===================================================== */

function BookingHistory() {
  /* ===================================================
     ADMIN
  =================================================== */

  const currentAdmin =
    getCurrentAdmin();

  /* ===================================================
     BOOKINGS
  =================================================== */

  const [bookings, setBookings] =
    useState([]);

  const [materials, setMaterials] =
    useState([]);

  /* ===================================================
     LOADING
  =================================================== */

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  /* ===================================================
     SEARCH
  =================================================== */

  const [search, setSearch] =
    useState("");

  const [paymentFilter, setPaymentFilter] =
    useState("ALL");

  const [returnFilter, setReturnFilter] =
    useState("ALL");

  const [progressFilter, setProgressFilter] =
    useState("ALL");

  /* ===================================================
     DETAILS
  =================================================== */

  const [selectedBooking, setSelectedBooking] =
    useState(null);

  /* ===================================================
     PAYMENT
  =================================================== */

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [paymentLoading, setPaymentLoading] =
    useState(false);

  /* ===================================================
     PICKUP
  =================================================== */

  const [pickupLoading, setPickupLoading] =
    useState(false);

  /* ===================================================
     RETURN
  =================================================== */

  const [returnData, setReturnData] =
    useState({});

  const [returnLoading, setReturnLoading] =
    useState(false);

  /* ===================================================
     EDIT
  =================================================== */

  const [editMode, setEditMode] =
    useState(false);

  const [editLoading, setEditLoading] =
    useState(false);

  const [editData, setEditData] =
    useState({
      customer: {
        name: "",
        mobile: "",
        address: "",
      },

      bookingDate: "",

      eventDate: "",

      items: [],

      advance: 0,
    });

  /* =====================================================
     FETCH BOOKINGS
  ===================================================== */

  const fetchBookings = async (
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
          API_URL
        );

      if (
        response.data?.success
      ) {
        setBookings(
          response.data.bookings || []
        );
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error(
        "Booking history error:",
        error
      );

      if (!showRefresh) {
        alert(
          error.response?.data
            ?.message ||
          "बुकिंग इतिहास मिळवताना त्रुटी आली."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =====================================================
     FETCH MATERIALS
  ===================================================== */

  const fetchMaterials = async () => {
    try {
      const response =
        await axios.get(
          MATERIAL_API_URL
        );

      if (
        response.data?.success
      ) {
        setMaterials(
          response.data.materials ||
          response.data.data ||
          []
        );
      }
    } catch (error) {
      console.error(
        "Material fetch error:",
        error
      );
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    fetchBookings();
    fetchMaterials();

    /*
      प्रत्येक 30 सेकंदांनी auto refresh.
      page उघडे असेल तेव्हाच चालेल.
    */

    const interval =
      setInterval(() => {
        fetchBookings(true);
      }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /* =====================================================
     FILTERED BOOKINGS
  ===================================================== */

  const filteredBookings =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      return bookings.filter(
        (booking) => {
          const name =
            booking.customer?.name
              ?.toLowerCase() || "";

          const mobile =
            booking.customer?.mobile
              ?.toLowerCase() || "";

          const bookingNumber =
            String(
              booking.bookingNumber ||
              ""
            ).toLowerCase();

          const searchMatch =
            !value ||
            name.includes(value) ||
            mobile.includes(value) ||
            bookingNumber.includes(
              value
            );

          const paymentMatch =
            paymentFilter === "ALL" ||
            booking.paymentStatus ===
            paymentFilter;

          const returnMatch =
            returnFilter === "ALL" ||
            booking.returnStatus ===
            returnFilter;

          const progressMatch =
            progressFilter === "ALL" ||
            booking.orderProgress ===
            progressFilter;

          return (
            searchMatch &&
            paymentMatch &&
            returnMatch &&
            progressMatch
          );
        }
      );
    }, [
      bookings,
      search,
      paymentFilter,
      returnFilter,
      progressFilter,
    ]);

  /* =====================================================
     SUMMARY
  ===================================================== */

  const summary =
    useMemo(() => {
      let totalAmount = 0;
      let received = 0;
      let returned = 0;

      bookings.forEach(
        (booking) => {
          totalAmount += Number(
            booking.totalAmount || 0
          );

          received += Number(
            booking.advanceAmount || 0
          );

          if (
            booking.orderProgress ===
            "RETURNED"
          ) {
            returned += 1;
          }
        }
      );

      return {
        totalBookings:
          bookings.length,

        totalAmount,

        received,

        returned,
      };
    }, [bookings]);

  /* =====================================================
     DATE FORMAT
  ===================================================== */

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

  /* =====================================================
     INPUT DATE
  ===================================================== */

  const getInputDate = (
    date
  ) => {
    if (!date) {
      return "";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "";
    }

    return parsed
      .toISOString()
      .split("T")[0];
  };

  /* =====================================================
     OPEN DETAILS
  ===================================================== */

  const openDetails = async (
    booking
  ) => {
    try {
      const response =
        await axios.get(
          `${API_URL}/${booking.id}`
        );

      if (
        response.data?.success
      ) {
        const freshBooking =
          response.data.booking;

        setSelectedBooking(
          freshBooking
        );

        /*
          Return input सुरुवातीला
          database मधील missingQuantity घेईल.
        */

        const initialReturnData =
          {};

        (
          freshBooking.items || []
        ).forEach(
          (item) => {
            initialReturnData[
              item.id
            ] = {
              missingQuantity:
                Number(
                  item.missingQuantity ||
                  0
                ),
            };
          }
        );

        setReturnData(
          initialReturnData
        );

        setPaymentAmount("");

        setEditMode(false);
      }
    } catch (error) {
      console.error(
        "Booking details error:",
        error
      );

      alert(
        error.response?.data
          ?.message ||
        "बुकिंगची माहिती मिळवताना त्रुटी आली."
      );
    }
  };

  /* =====================================================
     PAYMENT
     
     IMPORTANT:
     input मध्ये रक्कम लिहिताना
     database किंवा displayed जमा amount
     बदलत नाही.
     
     Button क्लिक झाल्यावरच API call होईल.
  ===================================================== */

  const handlePayment =
    async () => {
      if (!selectedBooking) {
        return;
      }

      const amount =
        Number(
          String(
            paymentAmount
          ).trim()
        );

      const remaining =
        Number(
          selectedBooking.remainingAmount ||
          0
        );

      if (
        !paymentAmount ||
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        alert(
          "कृपया जमा करायची योग्य रक्कम टाका."
        );

        return;
      }

      if (
        remaining <= 0
      ) {
        alert(
          "या बुकिंगचे पूर्ण पैसे आधीच जमा झाले आहेत."
        );

        return;
      }

      if (
        amount >
        remaining
      ) {
        alert(
          `जास्तीत जास्त ₹${remaining} जमा करता येतील.`
        );

        return;
      }

      try {
        setPaymentLoading(
          true
        );

        const response =
          await axios.patch(
            `${API_URL}/${selectedBooking.id}/payment`,
            {
              amount,
            }
          );

        if (
          response.data?.success
        ) {
          setSelectedBooking(
            response.data.booking
          );

          setPaymentAmount(
            ""
          );

          await fetchBookings(
            true
          );

          alert(
            `₹${amount} जमा झाले.`
          );
        } else {
          alert(
            response.data?.message ||
            "जमा रक्कम अपडेट झाली नाही."
          );
        }
      } catch (error) {
        console.error(
          "Payment error:",
          error
        );

        alert(
          error.response?.data
            ?.message ||
          "जमा रक्कम अपडेट करताना त्रुटी आली."
        );
      } finally {
        setPaymentLoading(
          false
        );
      }
    };

  /* =====================================================
     PICKUP
  ===================================================== */

  const handlePickup =
    async () => {
      if (!selectedBooking) {
        return;
      }

      if (!currentAdmin?.id) {
        alert(
          "कृपया आधी Admin निवडा."
        );

        return;
      }

      if (
        selectedBooking.orderProgress !==
        "BOOKED"
      ) {
        alert(
          "या बुकिंगची स्थिती बदलता येणार नाही."
        );

        return;
      }

      const confirmed =
        window.confirm(
          `ग्राहकाला साहित्य दिल्याची नोंद करायची का?\n\nदिले: ${currentAdmin.name}`
        );

      if (!confirmed) {
        return;
      }

      try {
        setPickupLoading(
          true
        );

        const response =
          await axios.patch(
            `${API_URL}/${selectedBooking.id}/pickup`,
            {
              adminId:
                Number(
                  currentAdmin.id
                ),
            }
          );

        if (
          response.data?.success
        ) {
          setSelectedBooking(
            response.data.booking
          );

          await fetchBookings(
            true
          );

          await fetchMaterials();

          alert(
            `साहित्य दिल्याची नोंद झाली.\n\nदिले: ${currentAdmin.name}`
          );
        } else {
          alert(
            response.data?.message ||
            "साहित्य दिल्याची नोंद झाली नाही."
          );
        }
      } catch (error) {
        console.error(
          "Pickup error:",
          error
        );

        alert(
          error.response?.data
            ?.message ||
          "साहित्य दिल्याची नोंद करताना त्रुटी आली."
        );
      } finally {
        setPickupLoading(
          false
        );
      }
    };

  /* =====================================================
     UPDATE MISSING
  ===================================================== */

  const updateMissing = (
    itemId,
    value,
    max
  ) => {
    let quantity =
      Number(value);

    if (
      !Number.isFinite(
        quantity
      )
    ) {
      quantity = 0;
    }

    quantity =
      Math.max(
        0,
        Math.min(
          quantity,
          Number(max || 0)
        )
      );

    setReturnData(
      (current) => ({
        ...current,

        [itemId]: {
          ...current[itemId],

          missingQuantity:
            quantity,
        },
      })
    );
  };

  /* =====================================================
     SAVE RETURN
  ===================================================== */

  const handleSaveReturn =
    async () => {
      if (!selectedBooking) {
        return;
      }

      if (!currentAdmin?.id) {
        alert(
          "कृपया आधी Admin निवडा."
        );

        return;
      }

      if (
        selectedBooking.orderProgress ===
        "BOOKED"
      ) {
        alert(
          "आधी ग्राहकाला साहित्य दिल्याची नोंद करा."
        );

        return;
      }

      if (
        selectedBooking.orderProgress ===
        "RETURNED"
      ) {
        alert(
          "या बुकिंगचे सर्व साहित्य आधीच परत आले आहे."
        );

        return;
      }

      const items =
        (
          selectedBooking.items || []
        ).map(
          (item) => ({
            bookingItemId:
              item.id,

            missingQuantity:
              Number(
                returnData[item.id]
                  ?.missingQuantity ||
                0
              ),
          })
        );

      try {
        setReturnLoading(
          true
        );

        const response =
          await axios.patch(
            `${API_URL}/${selectedBooking.id}/return`,
            {
              adminId:
                Number(
                  currentAdmin.id
                ),

              items,
            }
          );

        if (
          response.data?.success
        ) {
          setSelectedBooking(
            response.data.booking
          );

          await fetchBookings(
            true
          );

          await fetchMaterials();

          alert(
            `साहित्य परत घेतल्याची नोंद झाली.\n\nपरत घेणारे: ${currentAdmin.name}`
          );
        } else {
          alert(
            response.data?.message ||
            "साहित्य परताव्याची नोंद झाली नाही."
          );
        }
      } catch (error) {
        console.error(
          "Return error:",
          error
        );

        alert(
          error.response?.data
            ?.message ||
          "साहित्य परत घेताना त्रुटी आली."
        );
      } finally {
        setReturnLoading(
          false
        );
      }
    };

  /* =====================================================
     DELETE BOOKING
  ===================================================== */

  const handleDeleteBooking =
    async (
      booking
    ) => {
      const confirmed =
        window.confirm(
          `बिल क्रमांक ${booking.bookingNumber} ची बुकिंग हटवायची का?\n\nही कृती पुन्हा पूर्ववत करता येणार नाही.`
        );

      if (!confirmed) {
        return;
      }

      try {
        const response =
          await axios.delete(
            `${API_URL}/${booking.id}`
          );

        if (
          response.data?.success
        ) {
          setBookings(
            (current) =>
              current.filter(
                (item) =>
                  item.id !==
                  booking.id
              )
          );

          if (
            selectedBooking?.id ===
            booking.id
          ) {
            setSelectedBooking(
              null
            );
          }

          await fetchMaterials();

          alert(
            "बुकिंग हटवली आहे."
          );
        } else {
          alert(
            response.data?.message ||
            "बुकिंग हटवता आली नाही."
          );
        }
      } catch (error) {
        console.error(
          "Delete error:",
          error
        );

        alert(
          error.response?.data
            ?.message ||
          "बुकिंग हटवताना त्रुटी आली."
        );
      }
    };

  /* =====================================================
     EDIT - START
  ===================================================== */

  const startEdit = () => {
    if (!selectedBooking) {
      return;
    }

    const items =
      (
        selectedBooking.items || []
      ).map(
        (item) => ({
          bookingItemId:
            item.id,

          materialId:
            item.materialId,

          name:
            item.material?.name ||
            "",

          quantity:
            Number(
              item.quantity || 0
            ),

          rate:
            Number(
              item.rate || 0
            ),

          amount:
            Number(
              item.quantity || 0
            ) *
            Number(
              item.rate || 0
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
      );

    setEditData({
      customer: {
        name:
          selectedBooking.customer
            ?.name || "",

        mobile:
          selectedBooking.customer
            ?.mobile || "",

        address:
          selectedBooking.customer
            ?.address || "",
      },

      bookingDate:
        getInputDate(
          selectedBooking.bookingDate
        ),

      eventDate:
        getInputDate(
          selectedBooking.eventDate
        ),

      items,

      advance:
        Number(
          selectedBooking.advanceAmount ||
          0
        ),
    });

    setEditMode(true);
  };

  /* =====================================================
     EDIT CUSTOMER
  ===================================================== */

  const updateEditCustomer = (
    field,
    value
  ) => {
    setEditData(
      (current) => ({
        ...current,

        customer: {
          ...current.customer,
          [field]: value,
        },
      })
    );
  };

  /* =====================================================
     EDIT ITEM
  ===================================================== */

  const updateEditItem = (
    index,
    field,
    value
  ) => {
    setEditData(
      (current) => {
        const items = [
          ...current.items,
        ];

        if (!items[index]) {
          return current;
        }

        const item = {
          ...items[index],
        };

        if (
          field ===
          "quantity"
        ) {
          let quantity =
            Number(value);

          if (
            !Number.isFinite(
              quantity
            )
          ) {
            quantity = 0;
          }

          const returned =
            Number(
              item.returnedQuantity ||
              0
            );

          quantity =
            Math.max(
              quantity,
              returned
            );

          item.quantity =
            quantity;
        }

        if (
          field ===
          "rate"
        ) {
          let rate =
            Number(value);

          if (
            !Number.isFinite(
              rate
            )
          ) {
            rate = 0;
          }

          item.rate =
            Math.max(
              rate,
              0
            );
        }

        item.amount =
          Number(
            item.quantity || 0
          ) *
          Number(
            item.rate || 0
          );

        items[index] =
          item;

        return {
          ...current,

          items,
        };
      }
    );
  };

  /* =====================================================
     REMOVE ITEM
  ===================================================== */

  const removeEditItem = (
    index
  ) => {
    setEditData(
      (current) => ({
        ...current,

        items:
          current.items.filter(
            (_, itemIndex) =>
              itemIndex !==
              index
          ),
      })
    );
  };

  /* =====================================================
     ADD MATERIAL TO EDIT
  ===================================================== */

  const addEditMaterial = (
    materialId
  ) => {
    if (!materialId) {
      return;
    }

    const material =
      materials.find(
        (item) =>
          Number(item.id) ===
          Number(materialId)
      );

    if (!material) {
      return;
    }

    const exists =
      editData.items.some(
        (item) =>
          Number(
            item.materialId
          ) ===
          Number(material.id)
      );

    if (exists) {
      alert(
        "हे साहित्य आधीच जोडले आहे."
      );

      return;
    }

    const rate =
      Number(
        material.rate ||
        0
      );

    setEditData(
      (current) => ({
        ...current,

        items: [
          ...current.items,

          {
            bookingItemId:
              null,

            materialId:
              material.id,

            name:
              material.name,

            quantity:
              1,

            rate,

            amount:
              rate,

            returnedQuantity:
              0,

            missingQuantity:
              0,
          },
        ],
      })
    );
  };

  /* =====================================================
     EDIT TOTAL
  ===================================================== */

  const editTotalQuantity =
    editData.items.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );

  const editTotalAmount =
    editData.items.reduce(
      (sum, item) =>
        sum +
        Number(
          item.amount || 0
        ),
      0
    );

  const editAdvance =
    Math.max(
      Number(
        editData.advance || 0
      ),
      0
    );

  const editRemaining =
    Math.max(
      editTotalAmount -
      editAdvance,
      0
    );

  /* =====================================================
     SAVE EDIT
  ===================================================== */

  const handleSaveEdit =
    async () => {
      if (!selectedBooking) {
        return;
      }

      const name =
        editData.customer.name.trim();

      const mobile =
        editData.customer.mobile.trim();

      if (!name) {
        alert(
          "ग्राहकाचे नाव आवश्यक आहे."
        );

        return;
      }

      if (
        mobile.length !== 10
      ) {
        alert(
          "मोबाईल नंबर 10 अंकी असावा."
        );

        return;
      }

      if (
        !editData.bookingDate ||
        !editData.eventDate
      ) {
        alert(
          "दोन्ही तारीख आवश्यक आहेत."
        );

        return;
      }

      if (
        editData.eventDate <
        editData.bookingDate
      ) {
        alert(
          "कार्यक्रमाची तारीख बुकिंगच्या तारखेपेक्षा आधीची असू शकत नाही."
        );

        return;
      }

      if (
        editData.items.length === 0
      ) {
        alert(
          "किमान एक साहित्य असणे आवश्यक आहे."
        );

        return;
      }

      if (
        editAdvance >
        editTotalAmount
      ) {
        alert(
          "जमा रक्कम एकूण बिलापेक्षा जास्त असू शकत नाही."
        );

        return;
      }

      try {
        setEditLoading(
          true
        );

        const payload = {
          customer: {
            name,

            mobile,

            address:
              editData.customer.address.trim(),
          },

          bookingDate:
            editData.bookingDate,

          eventDate:
            editData.eventDate,

          materials:
            editData.items.map(
              (item) => ({
                bookingItemId:
                  item.bookingItemId ||
                  null,

                id:
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

        const response =
          await axios.put(
            `${API_URL}/${selectedBooking.id}`,
            payload
          );

        if (
          response.data?.success
        ) {
          setSelectedBooking(
            response.data.booking
          );

          setEditMode(
            false
          );

          await fetchBookings(
            true
          );

          await fetchMaterials();

          alert(
            "बुकिंग यशस्वीपणे बदलली आहे."
          );
        } else {
          alert(
            response.data?.message ||
            "बुकिंग बदलता आली नाही."
          );
        }
      } catch (error) {
        console.error(
          "Edit booking error:",
          error
        );

        alert(
          error.response?.data
            ?.message ||
          "बुकिंग बदलताना त्रुटी आली."
        );
      } finally {
        setEditLoading(
          false
        );
      }
    };
  /* =====================================================
 LABELS
===================================================== */

  const paymentLabel = (status) => {
    if (status === "PAID") {
      return "पूर्ण भरले";
    }

    if (status === "PARTIAL") {
      return "अंशतः भरले";
    }

    return "पैसे बाकी";
  };

  const returnLabel = (status) => {
    if (status === "COMPLETE") {
      return "पूर्ण परत";
    }

    if (status === "PARTIAL") {
      return "अंशतः परत";
    }

    return "परत बाकी";
  };

  const progressLabel = (status) => {
    if (status === "PICKED_UP") {
      return "साहित्य दिले";
    }

    if (status === "PARTIAL_RETURN") {
      return "अंशतः परत";
    }

    if (status === "RETURNED") {
      return "सर्व साहित्य परत";
    }

    return "बुकिंग झाली";
  };

  /* =====================================================
     MAIN UI
  ===================================================== */

  return (
    <div className="min-h-screen bg-[#f6f7fb] pb-8">

      {/* =================================================
        HEADER
    ================================================= */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-3 sm:px-4">

          <div className="flex min-w-0 items-center gap-2.5">

            <button
              type="button"
              onClick={() =>
                window.history.back()
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="min-w-0">

              <h1 className="truncate text-sm font-black text-slate-900">
                बुकिंग इतिहास
              </h1>

              <p className="text-[10px] text-slate-400">
                सर्व बुकिंगची माहिती
              </p>

            </div>

          </div>

          <div className="flex items-center gap-1.5">

            {currentAdmin && (
              <div className="hidden rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 sm:block">
                वापरकर्ता:{" "}
                {currentAdmin.name}
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                fetchBookings(true)
              }
              disabled={refreshing}
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
            title="एकूण बुकिंग"
            value={
              summary.totalBookings
            }
            icon={
              <Package size={16} />
            }
          />

          <SummaryCard
            title="एकूण रक्कम"
            value={`₹${summary.totalAmount}`}
            icon={
              <IndianRupee size={16} />
            }
          />

          <SummaryCard
            title="मिळालेले"
            value={`₹${summary.received}`}
            icon={
              <CheckCircle2 size={16} />
            }
          />

          <SummaryCard
            title="परत पूर्ण"
            value={
              summary.returned
            }
            icon={
              <RotateCcw size={16} />
            }
          />

        </section>

        {/* =================================================
          SEARCH + FILTER
      ================================================= */}

        <section className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">

          <div className="relative">

            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="नाव, मोबाईल किंवा बिल क्रमांक शोधा..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none transition focus:border-slate-900 focus:bg-white"
            />

          </div>

          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">

            <select
              value={
                paymentFilter
              }
              onChange={(e) =>
                setPaymentFilter(
                  e.target.value
                )
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
            >

              <option value="ALL">
                सर्व पेमेंट
              </option>

              <option value="PENDING">
                पैसे बाकी
              </option>

              <option value="PARTIAL">
                अंशतः भरले
              </option>

              <option value="PAID">
                पूर्ण भरले
              </option>

            </select>

            <select
              value={
                returnFilter
              }
              onChange={(e) =>
                setReturnFilter(
                  e.target.value
                )
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
            >

              <option value="ALL">
                सर्व परतावा
              </option>

              <option value="PENDING">
                परत बाकी
              </option>

              <option value="PARTIAL">
                अंशतः परत
              </option>

              <option value="COMPLETE">
                पूर्ण परत
              </option>

            </select>

            <select
              value={
                progressFilter
              }
              onChange={(e) =>
                setProgressFilter(
                  e.target.value
                )
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none"
            >

              <option value="ALL">
                सर्व स्थिती
              </option>

              <option value="BOOKED">
                बुकिंग झाली
              </option>

              <option value="PICKED_UP">
                साहित्य दिले
              </option>

              <option value="PARTIAL_RETURN">
                अंशतः परत
              </option>

              <option value="RETURNED">
                सर्व साहित्य परत
              </option>

            </select>

          </div>

        </section>

        {/* =================================================
          BOOKING LIST
      ================================================= */}

        {loading ? (

          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">

            <RefreshCw
              size={25}
              className="mx-auto animate-spin text-slate-400"
            />

            <p className="mt-2 text-xs text-slate-500">
              बुकिंग लोड होत आहेत...
            </p>

          </div>

        ) : filteredBookings.length === 0 ? (

          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">

            <Package
              size={28}
              className="mx-auto text-slate-300"
            />

            <h3 className="mt-2 text-sm font-bold text-slate-800">
              कोणतीही बुकिंग सापडली नाही
            </h3>

            <p className="mt-1 text-xs text-slate-400">
              शोध किंवा फिल्टर बदलून पुन्हा पहा.
            </p>

          </div>

        ) : (

          <section className="space-y-2">

            {filteredBookings.map(
              (booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onView={() =>
                    openDetails(
                      booking
                    )
                  }
                  onDelete={() =>
                    handleDeleteBooking(
                      booking
                    )
                  }
                  formatDate={
                    formatDate
                  }
                  paymentLabel={
                    paymentLabel
                  }
                  returnLabel={
                    returnLabel
                  }
                  progressLabel={
                    progressLabel
                  }
                />
              )
            )}

          </section>

        )}

      </main>

      {/* =====================================================
        DETAILS MODAL
    ===================================================== */}

      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          currentAdmin={
            currentAdmin
          }
          startEdit={startEdit}
          progressLabel={
            progressLabel
          }

          editMode={editMode}
          setEditMode={
            setEditMode
          }
          editData={editData}
          setEditData={
            setEditData
          }
          updateEditCustomer={
            updateEditCustomer
          }
          updateEditItem={
            updateEditItem
          }
          removeEditItem={
            removeEditItem
          }
          addEditMaterial={
            addEditMaterial
          }
          materials={materials}
          editTotalQuantity={
            editTotalQuantity
          }
          editTotalAmount={
            editTotalAmount
          }
          editAdvance={
            editAdvance
          }
          editRemaining={
            editRemaining
          }
          editLoading={
            editLoading
          }
          handleSaveEdit={
            handleSaveEdit
          }
          paymentAmount={
            paymentAmount
          }
          setPaymentAmount={
            setPaymentAmount
          }
          paymentLoading={
            paymentLoading
          }
          handlePayment={
            handlePayment
          }
          pickupLoading={
            pickupLoading
          }
          handlePickup={
            handlePickup
          }
          returnData={
            returnData
          }
          updateMissing={
            updateMissing
          }
          returnLoading={
            returnLoading
          }
          handleSaveReturn={
            handleSaveReturn
          }
          formatDate={
            formatDate
          }
          closeModal={() => {
            setSelectedBooking(
              null
            );

            setEditMode(
              false
            );

            setPaymentAmount("");
          }}
        />
      )}

    </div>
  );
}
/* =====================================================
   BOOKING DETAILS MODAL
===================================================== */

function BookingDetailsModal({
  booking,
  currentAdmin,
  progressLabel,
  editMode,
  setEditMode,
  startEdit,
  editData,
  setEditData,

  updateEditCustomer,
  updateEditItem,
  removeEditItem,
  addEditMaterial,

  materials,

  editTotalQuantity,
  editTotalAmount,
  editAdvance,
  editRemaining,

  editLoading,
  handleSaveEdit,

  paymentAmount,
  setPaymentAmount,
  paymentLoading,
  handlePayment,

  pickupLoading,
  handlePickup,

  returnData,
  updateMissing,
  returnLoading,
  handleSaveReturn,

  formatDate,

  closeModal,
}) {
  /* ===================================================
     PROGRESS
  =================================================== */

  const progress =
    booking.orderProgress ||
    "BOOKED";

  /* ===================================================
     PAYMENT STATUS
  =================================================== */

  const paymentStatus =
    booking.paymentStatus ||
    "PENDING";

  /* ===================================================
     RETURN STATUS
  =================================================== */

  const returnStatus =
    booking.returnStatus ||
    "PENDING";

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center sm:p-3">

      <div className="flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3.5 py-3">

          <div className="min-w-0">

            <div className="flex items-center gap-2">

              <span className="rounded-md bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-500">
                बिल
              </span>

              <h2 className="text-sm font-black text-slate-900">
                {booking.bookingNumber}
              </h2>

            </div>

            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {booking.customer?.name || "-"}
            </p>

          </div>

          <div className="flex items-center gap-1.5">

            {!editMode && (
              <button
                type="button"
                onClick={startEdit}

                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-2 text-[10px] font-bold text-white"
              >
                <Pencil size={13} />
                बदल करा
              </button>
            )}

            <button
              type="button"
              onClick={closeModal}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700"
            >
              <X size={16} />
            </button>

          </div>

        </div>

        {/* =================================================
            SCROLL CONTENT
        ================================================= */}

        <div className="min-h-0 flex-1 overflow-y-auto p-3">

          {editMode ? (
            /* =================================================
               EDIT MODE
            ================================================= */
            <div className="space-y-2.5">

              {/* =================================================
                  CUSTOMER EDIT
              ================================================= */}

              <DetailSection
                title="ग्राहकाची माहिती"
                icon={
                  <User size={15} />
                }
              >

                <div className="space-y-2">

                  <input
                    type="text"
                    value={
                      editData.customer.name
                    }
                    onChange={(e) =>
                      updateEditCustomer(
                        "name",
                        e.target.value
                      )
                    }
                    placeholder="ग्राहकाचे नाव"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900"
                  />

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={
                      editData.customer.mobile
                    }
                    onChange={(e) =>
                      updateEditCustomer(
                        "mobile",
                        e.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    placeholder="मोबाईल नंबर"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900"
                  />

                  <textarea
                    rows={2}
                    value={
                      editData.customer.address
                    }
                    onChange={(e) =>
                      updateEditCustomer(
                        "address",
                        e.target.value
                      )
                    }
                    placeholder="पत्ता"
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900"
                  />

                  <div className="grid grid-cols-2 gap-2">

                    <div>

                      <label className="mb-1 block text-[10px] font-bold text-slate-500">
                        बुकिंग तारीख
                      </label>

                      <input
                        type="date"
                        value={
                          editData.bookingDate
                        }
                        onChange={(e) =>
                          setEditData(
                            (current) => ({
                              ...current,
                              bookingDate:
                                e.target.value,
                            })
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-2.5 text-xs outline-none focus:border-slate-900"
                      />

                    </div>

                    <div>

                      <label className="mb-1 block text-[10px] font-bold text-slate-500">
                        कार्यक्रम तारीख
                      </label>

                      <input
                        type="date"
                        min={
                          editData.bookingDate ||
                          undefined
                        }
                        value={
                          editData.eventDate
                        }
                        onChange={(e) =>
                          setEditData(
                            (current) => ({
                              ...current,
                              eventDate:
                                e.target.value,
                            })
                          )
                        }
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-2.5 text-xs outline-none focus:border-slate-900"
                      />

                    </div>

                  </div>

                </div>

              </DetailSection>

              {/* =================================================
                  MATERIAL EDIT
              ================================================= */}

              <DetailSection
                title="साहित्य बदल"
                icon={
                  <Package size={15} />
                }
              >

                <div className="space-y-1.5">

                  {editData.items.map(
                    (item, index) => (
                      <div
                        key={
                          item.bookingItemId ||
                          `new-${item.materialId}-${index}`
                        }
                        className="rounded-lg border border-slate-200 p-2.5"
                      >

                        <div className="flex items-center justify-between gap-2">

                          <div className="min-w-0">

                            <p className="truncate text-xs font-black text-slate-900">
                              {item.name}
                            </p>

                            {Number(
                              item.returnedQuantity ||
                              0
                            ) > 0 && (
                                <p className="mt-0.5 text-[9px] text-emerald-600">
                                  आधी परत आलेले:{" "}
                                  {
                                    item.returnedQuantity
                                  } नग
                                </p>
                              )}

                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removeEditItem(
                                index
                              )
                            }
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500"
                          >
                            <Trash2
                              size={14}
                            />
                          </button>

                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2">

                          <div>

                            <label className="mb-1 block text-[9px] font-bold text-slate-500">
                              नग
                            </label>

                            <input
                              type="number"
                              min={Number(
                                item.returnedQuantity ||
                                0
                              )}
                              value={
                                item.quantity
                              }
                              onChange={(e) =>
                                updateEditItem(
                                  index,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs text-center font-bold outline-none"
                            />

                          </div>

                          <div>

                            <label className="mb-1 block text-[9px] font-bold text-slate-500">
                              दर
                            </label>

                            <input
                              type="number"
                              min="0"
                              value={
                                item.rate
                              }
                              onChange={(e) =>
                                updateEditItem(
                                  index,
                                  "rate",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-lg border border-slate-200 px-2 py-2 text-xs text-center font-bold outline-none"
                            />

                          </div>

                        </div>

                        <div className="mt-1.5 flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5">

                          <span className="text-[10px] text-slate-400">
                            रक्कम
                          </span>

                          <span className="text-xs font-black text-slate-900">
                            ₹
                            {Number(
                              item.amount || 0
                            )}
                          </span>

                        </div>

                      </div>
                    )
                  )}

                </div>

                {materials.length > 0 && (
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      addEditMaterial(
                        e.target.value
                      );

                      e.target.value =
                        "";
                    }}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-slate-900"
                  >

                    <option value="">
                      + नवीन साहित्य जोडा
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
                          {material.name}
                        </option>
                      )
                    )}

                  </select>
                )}

              </DetailSection>

              {/* =================================================
                  PAYMENT EDIT
              ================================================= */}

              <DetailSection
                title="पेमेंट बदल"
                icon={
                  <IndianRupee size={15} />
                }
              >

                <div className="grid grid-cols-3 gap-1.5">

                  <MoneyMini
                    label="एकूण"
                    value={
                      editTotalAmount
                    }
                  />

                  <MoneyMini
                    label="जमा"
                    value={
                      editAdvance
                    }
                    positive
                  />

                  <MoneyMini
                    label="बाकी"
                    value={
                      editRemaining
                    }
                    warning
                  />

                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    editData.advance
                  }
                  onChange={(e) =>
                    setEditData(
                      (current) => ({
                        ...current,
                        advance:
                          Number(
                            e.target.value.replace(
                              /\D/g,
                              ""
                            )
                          ) || 0,
                      })
                    )
                  }
                  placeholder="जमा रक्कम"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-slate-900"
                />

              </DetailSection>

              {/* =================================================
                  EDIT SUMMARY
              ================================================= */}

              <div className="rounded-xl bg-slate-900 px-3 py-3 text-white">

                <div className="flex items-center justify-between">

                  <span className="text-[10px] text-slate-400">
                    एकूण नग
                  </span>

                  <b className="text-sm">
                    {editTotalQuantity} नग
                  </b>

                </div>

                <div className="mt-1 flex items-center justify-between">

                  <span className="text-[10px] text-slate-400">
                    एकूण रक्कम
                  </span>

                  <b className="text-base">
                    ₹
                    {editTotalAmount}
                  </b>

                </div>

                <div className="mt-1 flex items-center justify-between">

                  <span className="text-[10px] text-slate-400">
                    बाकी
                  </span>

                  <b className="text-sm">
                    ₹
                    {editRemaining}
                  </b>

                </div>

              </div>

              {/* =================================================
                  EDIT BUTTONS
              ================================================= */}

              <div className="grid grid-cols-2 gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setEditMode(
                      false
                    )
                  }
                  disabled={
                    editLoading
                  }
                  className="rounded-lg border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 disabled:opacity-60"
                >
                  रद्द करा
                </button>

                <button
                  type="button"
                  onClick={
                    handleSaveEdit
                  }
                  disabled={
                    editLoading
                  }
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 py-2.5 text-xs font-bold text-white disabled:opacity-60"
                >

                  {editLoading ? (
                    <>
                      <RefreshCw
                        size={13}
                        className="animate-spin"
                      />

                      जतन होत आहे...
                    </>
                  ) : (
                    <>
                      <Save size={13} />

                      बदल जतन करा
                    </>
                  )}

                </button>

              </div>

            </div>
          ) : (
            /* =================================================
               NORMAL MODE
            ================================================= */
            <div className="space-y-2.5">

              {/* =================================================
                  STATUS
              ================================================= */}

              <section className="rounded-xl bg-slate-900 px-3 py-3 text-white">

                <div className="flex items-center justify-between gap-2">

                  <div>

                    <p className="text-[9px] text-slate-400">
                      सध्याची स्थिती
                    </p>

                    <p className="mt-0.5 text-sm font-black">
                      {progressLabel(
                        progress
                      )}
                    </p>

                  </div>

                  <ProgressBadge
                    status={
                      progress
                    }
                    label={
                      progressLabel(
                        progress
                      )
                    }
                  />

                </div>

              </section>

              {/* =================================================
                  CUSTOMER
              ================================================= */}

              <DetailSection
                title="ग्राहक"
                icon={
                  <User size={15} />
                }
              >

                <div className="grid grid-cols-2 gap-1.5">

                  <DetailMini
                    label="नाव"
                    value={
                      booking.customer?.name
                    }
                  />

                  <DetailMini
                    label="मोबाईल"
                    value={
                      booking.customer?.mobile
                    }
                  />

                  <DetailMini
                    label="बुकिंग"
                    value={formatDate(
                      booking.bookingDate
                    )}
                  />

                  <DetailMini
                    label="कार्यक्रम"
                    value={formatDate(
                      booking.eventDate
                    )}
                  />

                </div>

                {booking.customer?.address && (
                  <div className="mt-1.5 rounded-lg bg-slate-50 px-2.5 py-2">

                    <p className="text-[9px] text-slate-400">
                      पत्ता
                    </p>

                    <p className="mt-0.5 text-[11px] font-bold text-slate-800">
                      {
                        booking.customer.address
                      }
                    </p>

                  </div>
                )}

              </DetailSection>

              {/* =================================================
                  ADMIN TRACKING
              ================================================= */}

              <DetailSection
                title="कामाची नोंद"
                icon={
                  <Users size={15} />
                }
              >

                <div className="grid grid-cols-3 gap-1.5">

                  <TrackMini
                    label="बुकिंग केली"
                    name={
                      booking.admin?.name
                    }
                  />

                  <TrackMini
                    label="साहित्य दिले"
                    name={
                      booking.pickedUpByAdmin?.name
                    }
                  />

                  <TrackMini
                    label="साहित्य परत"
                    name={
                      booking.returnByAdmin?.name
                    }
                  />

                </div>

              </DetailSection>

              {/* =================================================
                  MATERIAL
              ================================================= */}

              <DetailSection
                title="साहित्य"
                icon={
                  <Package size={15} />
                }
              >

                <div className="space-y-1.5">

                  {(booking.items || []).map(
                    (item) => {

                      const total =
                        Number(
                          item.quantity || 0
                        );

                      const returned =
                        Number(
                          item.returnedQuantity ||
                          0
                        );

                      const missing =
                        Number(
                          item.missingQuantity ||
                          0
                        );

                      const pending =
                        Math.max(
                          total -
                          returned -
                          missing,
                          0
                        );

                      return (
                        <div
                          key={
                            item.id
                          }
                          className="rounded-lg bg-slate-50 px-2.5 py-2"
                        >

                          <div className="flex items-center justify-between gap-2">

                            <div className="min-w-0">

                              <p className="truncate text-xs font-black text-slate-900">
                                {
                                  item.material?.name ||
                                  "-"
                                }
                              </p>

                              <p className="mt-0.5 text-[9px] text-slate-400">
                                {total} नग × ₹
                                {Number(
                                  item.rate || 0
                                )}
                              </p>

                            </div>

                            <p className="shrink-0 text-sm font-black text-slate-900">
                              ₹
                              {Number(
                                item.amount || 0
                              )}
                            </p>

                          </div>

                          <div className="mt-1.5 grid grid-cols-3 gap-1">

                            <QuantityMini
                              label="दिले"
                              value={
                                total
                              }
                              type="normal"
                            />

                            <QuantityMini
                              label="परत"
                              value={
                                returned
                              }
                              type="success"
                            />

                            <QuantityMini
                              label="बाकी"
                              value={
                                pending
                              }
                              type="warning"
                            />

                          </div>

                          {missing > 0 && (
                            <div className="mt-1 flex items-center justify-between text-[9px] text-red-600">

                              <span>
                                कमी आलेले
                              </span>

                              <b>
                                {missing} नग
                              </b>

                            </div>
                          )}

                        </div>
                      );
                    }
                  )}

                </div>

              </DetailSection>

              {/* =================================================
                  PAYMENT
              ================================================= */}

              <DetailSection
                title="पेमेंट"
                icon={
                  <IndianRupee size={15} />
                }
              >

                <div className="grid grid-cols-3 gap-1.5">

                  <MoneyMini
                    label="एकूण"
                    value={
                      booking.totalAmount
                    }
                  />

                  <MoneyMini
                    label="जमा"
                    value={
                      booking.advanceAmount
                    }
                    positive
                  />

                  <MoneyMini
                    label="बाकी"
                    value={
                      booking.remainingAmount
                    }
                    warning
                  />

                </div>

                {/* =================================================
                    PAYMENT INPUT
                ================================================= */}

                {Number(
                  booking.remainingAmount ||
                  0
                ) > 0 && (

                    <div className="mt-2">

                      <div className="flex gap-1.5">

                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          value={
                            paymentAmount
                          }
                          onChange={(e) => {

                            const value =
                              e.target.value.replace(
                                /\D/g,
                                ""
                              );

                            setPaymentAmount(
                              value
                            );

                          }}
                          placeholder="जमा करायची रक्कम"
                          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-slate-900"
                        />

                        <button
                          type="button"
                          onClick={
                            handlePayment
                          }
                          disabled={
                            paymentLoading ||
                            !paymentAmount
                          }
                          className="shrink-0 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >

                          {paymentLoading
                            ? "जमा होत आहे..."
                            : "जमा करा"}

                        </button>

                      </div>

                      <div className="mt-1 flex items-center justify-between">

                        <span className="text-[9px] text-slate-400">
                          बाकी: ₹
                          {Number(
                            booking.remainingAmount ||
                            0
                          )}
                        </span>

                        {paymentAmount && (
                          <span className="text-[9px] font-bold text-slate-500">
                            जमा होणार: ₹
                            {Number(
                              paymentAmount
                            )}
                          </span>
                        )}

                      </div>

                    </div>

                  )}

              </DetailSection>

              {/* =================================================
                  PICKUP
              ================================================= */}

              {progress ===
                "BOOKED" && (

                  <section className="rounded-xl border border-blue-200 bg-blue-50 p-3">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-xs font-black text-blue-900">
                          ग्राहकाला साहित्य दिले आहे का?
                        </p>

                        <p className="mt-0.5 text-[9px] text-blue-700">
                          वापरकर्ता:{" "}
                          <b>
                            {
                              currentAdmin?.name ||
                              "-"
                            }
                          </b>
                        </p>

                      </div>

                      <Truck
                        size={18}
                        className="text-blue-600"
                      />

                    </div>

                    <button
                      type="button"
                      onClick={
                        handlePickup
                      }
                      disabled={
                        pickupLoading
                      }
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white disabled:opacity-60"
                    >

                      {pickupLoading ? (
                        <>
                          <RefreshCw
                            size={13}
                            className="animate-spin"
                          />

                          नोंद होत आहे...
                        </>
                      ) : (
                        <>
                          <Truck size={13} />

                          ग्राहकाला साहित्य दिले
                        </>
                      )}

                    </button>

                  </section>

                )}

              {/* =================================================
                  RETURN
              ================================================= */}

              {progress !==
                "BOOKED" &&
                progress !==
                "RETURNED" && (

                  <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-xs font-black text-emerald-900">
                          साहित्य परत घेतले
                        </p>

                        <p className="mt-0.5 text-[9px] text-emerald-700">
                          परत घेणारे:{" "}
                          <b>
                            {
                              currentAdmin?.name ||
                              "-"
                            }
                          </b>
                        </p>

                      </div>

                      <RotateCcw
                        size={18}
                        className="text-emerald-600"
                      />

                    </div>

                    <div className="mt-2 space-y-1.5">

                      {(booking.items || []).map(
                        (item) => {

                          const missing =
                            returnData[
                              item.id
                            ]?.missingQuantity ??
                            Number(
                              item.missingQuantity ||
                              0
                            );

                          const returned =
                            Math.max(
                              Number(
                                item.quantity ||
                                0
                              ) -
                              Number(
                                missing || 0
                              ),
                              0
                            );

                          return (
                            <div
                              key={
                                item.id
                              }
                              className="rounded-lg bg-white px-2.5 py-2"
                            >

                              <div className="flex items-center justify-between">

                                <span className="text-xs font-bold text-slate-800">
                                  {
                                    item.material?.name ||
                                    "-"
                                  }
                                </span>

                                <span className="text-[9px] font-bold text-emerald-600">
                                  परत:{" "}
                                  {returned} नग
                                </span>

                              </div>

                              <div className="mt-1.5 flex items-center gap-2">

                                <label className="text-[9px] font-bold text-red-600">
                                  कमी:
                                </label>

                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={
                                    missing
                                  }
                                  onChange={(e) =>
                                    updateMissing(
                                      item.id,
                                      e.target.value,
                                      item.quantity
                                    )
                                  }
                                  className="w-20 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-center text-xs font-bold text-red-700 outline-none"
                                />

                              </div>

                            </div>
                          );
                        }
                      )}

                    </div>

                    <button
                      type="button"
                      onClick={
                        handleSaveReturn
                      }
                      disabled={
                        returnLoading
                      }
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white disabled:opacity-60"
                    >

                      {returnLoading ? (
                        <>
                          <RefreshCw
                            size={13}
                            className="animate-spin"
                          />

                          नोंद होत आहे...
                        </>
                      ) : (
                        <>
                          <RotateCcw
                            size={13}
                          />

                          साहित्य परत घेतले
                        </>
                      )}

                    </button>

                  </section>

                )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
/* =====================================================
   BOOKING CARD
===================================================== */

/* =====================================================
   COMPACT BOOKING CARD
===================================================== */

function BookingCard({
  booking,
  onView,
  onDelete,
  formatDate,
  paymentLabel,
  returnLabel,
}) {
  const progress =
    booking.orderProgress ||
    "BOOKED";

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

  /* =================================================
     MATERIAL STATUS
  ================================================= */

  let materialText =
    "साहित्य दिले नाही";

  let materialClass =
    "border-amber-200 bg-amber-50 text-amber-700";

  if (
    progress === "PICKED_UP"
  ) {
    materialText =
      `दिले${pickedUpBy
        ? ` — ${pickedUpBy}`
        : ""
      }`;

    materialClass =
      "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (
    progress === "PARTIAL_RETURN"
  ) {
    materialText =
      `अंशतः परत${returnedBy
        ? ` — ${returnedBy}`
        : ""
      }`;

    materialClass =
      "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (
    progress === "RETURNED"
  ) {
    materialText =
      `पूर्ण परत${returnedBy
        ? ` — ${returnedBy}`
        : ""
      }`;

    materialClass =
      "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">

      <div className="px-3 py-2.5">

        {/* =================================================
            ROW 1
        ================================================= */}

        <div className="flex items-center justify-between gap-2">

          <div className="flex min-w-0 items-center gap-1.5">

            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold text-slate-500">
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

          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold text-slate-600">

            {progress === "PICKED_UP"
              ? "दिलं"
              : progress ===
                "PARTIAL_RETURN"
                ? "अंशतः परत"
                : progress ===
                  "RETURNED"
                  ? "पूर्ण परत"
                  : "बुकिंग"}

          </span>

        </div>

        {/* =================================================
            ROW 2
        ================================================= */}

        <div className="mt-1 flex items-center justify-between">

          <div className="flex items-center gap-2 text-[10px] text-slate-500">

            <span className="flex items-center gap-1">
              <Phone size={11} />

              {booking.customer?.mobile ||
                "-"}
            </span>

            <span className="text-slate-300">
              |
            </span>

            <span>
              {totalQuantity} नग
            </span>

          </div>

          <span className="text-sm font-black text-slate-900">
            ₹{totalAmount}
          </span>

        </div>

        {/* =================================================
            ROW 3 — DATES
        ================================================= */}

        <div className="mt-1.5 flex items-center justify-between rounded-md bg-slate-50 px-2 py-1.5">

          <span className="text-[9px] text-slate-500">
            बुकिंग:{" "}
            <b className="text-slate-700">
              {formatDate(
                booking.bookingDate
              )}
            </b>
          </span>

          <span className="text-[9px] text-orange-600">
            कार्यक्रम:{" "}
            <b className="text-slate-700">
              {formatDate(
                booking.eventDate
              )}
            </b>
          </span>

        </div>

        {/* =================================================
            ROW 4 — PAYMENT
        ================================================= */}

        <div className="mt-1.5 flex items-center justify-between text-[9px]">

          <span className="text-slate-500">
            एकूण{" "}
            <b className="text-slate-800">
              ₹{totalAmount}
            </b>
          </span>

          <span className="text-emerald-600">
            जमा{" "}
            <b>
              ₹{advanceAmount}
            </b>
          </span>

          <span className="text-orange-600">
            बाकी{" "}
            <b>
              ₹{remainingAmount}
            </b>
          </span>

        </div>

        {/* =================================================
            ROW 5 — ADMIN
        ================================================= */}

        <div className="mt-1.5 text-[9px] text-slate-500">

          बुकिंग:
          <b className="ml-1 text-slate-800">
            {bookedBy}
          </b>

          {pickedUpBy && (
            <>
              <span className="mx-1.5 text-slate-300">
                |
              </span>

              दिले:
              <b className="ml-1 text-blue-700">
                {pickedUpBy}
              </b>
            </>
          )}

          {returnedBy && (
            <>
              <span className="mx-1.5 text-slate-300">
                |
              </span>

              परत:
              <b className="ml-1 text-emerald-700">
                {returnedBy}
              </b>
            </>
          )}

        </div>

        {/* =================================================
            ROW 6 — MATERIAL STATUS
        ================================================= */}

        <div
          className={`mt-1.5 flex items-center justify-between rounded-md border px-2 py-1.5 ${materialClass}`}
        >

          <span className="text-[9px] opacity-70">
            साहित्य
          </span>

          <span className="text-[10px] font-black">
            {materialText}
          </span>

        </div>

        {/* =================================================
            ROW 7 — PAYMENT / RETURN
        ================================================= */}

        <div className="mt-1 flex items-center justify-between text-[9px]">

          <span className="text-slate-500">
            पेमेंट:{" "}
            <b
              className={
                booking.paymentStatus ===
                  "PAID"
                  ? "text-emerald-600"
                  : booking.paymentStatus ===
                    "PARTIAL"
                    ? "text-orange-600"
                    : "text-red-600"
              }
            >
              {paymentLabel(
                booking.paymentStatus
              )}
            </b>
          </span>

          <span className="text-slate-500">
            परतावा:{" "}
            <b
              className={
                booking.returnStatus ===
                  "COMPLETE"
                  ? "text-emerald-600"
                  : booking.returnStatus ===
                    "PARTIAL"
                    ? "text-orange-600"
                    : "text-slate-600"
              }
            >
              {returnLabel(
                booking.returnStatus
              )}
            </b>
          </span>

        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="mt-1.5 flex gap-1.5">

          <button
            type="button"
            onClick={onView}
            className="flex flex-1 items-center justify-center gap-1 rounded-md bg-slate-900 py-2 text-[10px] font-bold text-white"
          >

            <Eye size={12} />

            पूर्ण माहिती

          </button>

          <button
            type="button"
            onClick={onDelete}
            className="flex h-[32px] w-[34px] items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-500"
          >

            <Trash2 size={13} />

          </button>

        </div>

      </div>

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
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">

      <div className="flex items-center gap-1.5">

        <div className="text-slate-500">
          {icon}
        </div>

        <span className="text-[10px] font-semibold text-slate-500">
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
   DETAIL SECTION
===================================================== */

function DetailSection({
  title,
  icon,
  children,
}) {
  return (
    <section className="rounded-xl border border-slate-200 p-3">

      <div className="mb-2 flex items-center gap-2">

        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </div>

        <h3 className="text-xs font-black text-slate-900">
          {title}
        </h3>

      </div>

      {children}

    </section>
  );
}

/* =====================================================
   DETAIL MINI
===================================================== */

function DetailMini({
  label,
  value,
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-2.5 py-2">

      <p className="text-[9px] text-slate-400">
        {label}
      </p>

      <p className="mt-0.5 truncate text-[11px] font-bold text-slate-800">
        {value || "-"}
      </p>

    </div>
  );
}

/* =====================================================
   TRACK MINI
===================================================== */

function TrackMini({
  label,
  name,
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-2.5 py-2">

      <p className="text-[9px] text-slate-400">
        {label}
      </p>

      <p className="mt-0.5 truncate text-[11px] font-black text-slate-800">
        {name || "नोंद नाही"}
      </p>

    </div>
  );
}

/* =====================================================
   MONEY MINI
===================================================== */

function MoneyMini({
  label,
  value,
  positive = false,
  warning = false,
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-2.5 py-2 text-center">

      <p className="text-[9px] text-slate-400">
        {label}
      </p>

      <p
        className={`mt-0.5 text-sm font-black ${positive
            ? "text-emerald-600"
            : warning
              ? "text-orange-600"
              : "text-slate-900"
          }`}
      >
        ₹
        {Number(
          value || 0
        )}
      </p>

    </div>
  );
}

/* =====================================================
   QUANTITY MINI
===================================================== */

function QuantityMini({
  label,
  value,
  type = "normal",
}) {
  const styles = {
    normal:
      "bg-slate-100 text-slate-700",

    success:
      "bg-emerald-50 text-emerald-700",

    warning:
      "bg-orange-50 text-orange-700",
  };

  return (
    <div
      className={`rounded-md px-2 py-1.5 text-center ${styles[type] ||
        styles.normal
        }`}
    >

      <p className="text-[9px]">
        {label}
      </p>

      <p className="text-xs font-black">
        {value}
      </p>

    </div>
  );
}

/* =====================================================
   PROGRESS BADGE
===================================================== */

function ProgressBadge({
  status,
  label,
}) {
  const styles = {
    BOOKED:
      "bg-slate-100 text-slate-700",

    PICKED_UP:
      "bg-blue-50 text-blue-700",

    PARTIAL_RETURN:
      "bg-orange-50 text-orange-700",

    RETURNED:
      "bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black ${styles[status] ||
        styles.BOOKED
        }`}
    >
      {label}
    </span>
  );
}

/* =====================================================
   EXPORT
===================================================== */

export default BookingHistory;