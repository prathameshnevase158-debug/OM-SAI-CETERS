import express from "express";
import cors from "cors";

import bookingRoutes from "./routes/bookingRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

/* =====================================================
   CORS
===================================================== */

const allowedOrigins = [
  // Render production frontend
  "https://om-sai-ceters.onrender.com",

  // Local development
  "http://localhost:5173",
  "http://localhost:4173",

  // Local network
  "http://10.42.240.226:4173",

  // Capacitor Android
  "http://localhost",
  "https://localhost",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without Origin
      // (Postman, Render health checks, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },

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

    credentials: true,
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

app.use("/api/admins", adminRoutes);

/* =====================================================
   BOOKING ROUTES
===================================================== */

app.use("/api/bookings", bookingRoutes);

/* =====================================================
   MATERIAL ROUTES
===================================================== */

app.use("/api/materials", materialRoutes);

export default app;