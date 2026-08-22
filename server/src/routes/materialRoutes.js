import express from "express";

import {
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from "../controllers/materialController.js";

const router = express.Router();

/* GET ALL */
router.get("/", getMaterials);

/* CREATE */
router.post("/", createMaterial);

/* UPDATE */
router.patch("/:id", updateMaterial);

/* DELETE */
router.delete("/:id", deleteMaterial);

export default router;