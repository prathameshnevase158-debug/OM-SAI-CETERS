import express from "express";

import {
  createBooking,
  getBookings,
  getBookingById,
  getBookingBillPDF,
  getPendingOrders,
  getBookingNotifications,
  updateBooking,
  updatePayment,
  pickupMaterial,
  returnMaterial,
  deleteBooking,
  sendBookingBillWhatsApp,
} from "../controllers/bookingController.js";

import {
  generateBookingBill,
} from "../controllers/billController.js";

const router = express.Router();

/* =====================================================
   CREATE BOOKING
   POST /api/bookings
===================================================== */

router.post(
  "/",
  createBooking
);

/* =====================================================
   GET ALL BOOKINGS
   GET /api/bookings
===================================================== */

router.get(
  "/",
  getBookings
);

/* =====================================================
   PENDING ORDERS
   GET /api/bookings/pending
===================================================== */

router.get(
  "/pending",
  getPendingOrders
);

/* =====================================================
   BOOKING NOTIFICATIONS
   GET /api/bookings/notifications
===================================================== */

router.get(
  "/notifications",
  getBookingNotifications
);

/* =====================================================
   BILL PDF
   GET /api/bookings/:id/bill
===================================================== */

router.get(
  "/:id/bill",
  generateBookingBill
);

/* =====================================================
   BILL PDF FOR MOBILE SHARE
   GET /api/bookings/:id/bill-pdf
===================================================== */

router.get(
  "/:id/bill-pdf",
  getBookingBillPDF
);

/* =====================================================
   SEND BILL ON WHATSAPP
   POST /api/bookings/:id/send-whatsapp
===================================================== */

router.post(
  "/:id/send-whatsapp",
  sendBookingBillWhatsApp
);

/* =====================================================
   PICKUP MATERIAL
   PATCH /api/bookings/:id/pickup

   Customer ने साहित्य घेतले.
===================================================== */

router.patch(
  "/:id/pickup",
  pickupMaterial
);

/* =====================================================
   GET SINGLE BOOKING
   GET /api/bookings/:id

   IMPORTANT:
   pending आणि notifications routes च्या नंतर
   single booking route ठेवला आहे.
===================================================== */

router.get(
  "/:id",
  getBookingById
);

/* =====================================================
   UPDATE BOOKING
   PUT /api/bookings/:id
===================================================== */

router.put(
  "/:id",
  updateBooking
);

/* =====================================================
   UPDATE BOOKING
   PATCH /api/bookings/:id
===================================================== */

router.patch(
  "/:id",
  updateBooking
);

/* =====================================================
   UPDATE PAYMENT
   PATCH /api/bookings/:id/payment
===================================================== */

router.patch(
  "/:id/payment",
  updatePayment
);

/* =====================================================
   RETURN MATERIAL
   PATCH /api/bookings/:id/return

   साहित्य परत घेताना:
   adminId
   items
   पाठवायचे.
===================================================== */

router.patch(
  "/:id/return",
  returnMaterial
);

/* =====================================================
   DELETE BOOKING
   DELETE /api/bookings/:id
===================================================== */

router.delete(
  "/:id",
  deleteBooking
);

/* =====================================================
   END
===================================================== */

export default router;