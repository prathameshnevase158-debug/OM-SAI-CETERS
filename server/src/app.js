import express from "express";
import cors from "cors";

import bookingRoutes from "./routes/bookingRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

/* =====================================================
   CORS
   Allow localhost + mobile/PC network
===================================================== */

app.use(
  cors({
  origin: [
  "http://localhost:5173",
  "http://localhost:4173",
  "http://10.42.240.226:4173",

  // Capacitor Android
  "http://localhost",
  "https://localhost",
],

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

/* =====================================================
   BODY PARSER
===================================================== */

app.use(express.json());

/* =====================================================
   ROOT
===================================================== */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "OM SAI CATERERS API is running",
  });
});

/* =====================================================
   ADMIN ROUTES
===================================================== */

app.use(
  "/api/admins",
  adminRoutes
);

/* =====================================================
   BOOKING ROUTES
===================================================== */

app.use(
  "/api/bookings",
  bookingRoutes
);

/* =====================================================
   MATERIAL ROUTES
===================================================== */

app.use(
  "/api/materials",
  materialRoutes
);

export default app;