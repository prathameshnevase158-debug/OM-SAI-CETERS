import express from "express";
import prisma from "../config/prisma.js";

const router = express.Router();

/* =====================================================
   GET ACTIVE ADMINS
   GET /api/admins
===================================================== */

router.get("/", async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      where: {
        isActive: true,
      },

      select: {
        id: true,
        name: true,
        whatsappKey: true,
      },

      orderBy: {
        id: "asc",
      },
    });

    return res.json({
      success: true,
      admins,
    });
  } catch (error) {
    console.error(
      "GET ADMINS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admins.",
    });
  }
});

export default router;