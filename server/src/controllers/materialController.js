  import prisma from "../config/prisma.js";

  /* =====================================================
    GET ALL MATERIALS
  ===================================================== */

  export const getMaterials = async (req, res) => {
    try {
      console.log("GET MATERIALS HIT");
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

      const materials = await prisma.material.findMany({
        orderBy: {
          id: "asc",
        },
      });

      console.log("MATERIAL COUNT:", materials.length);
console.log("MATERIAL DATA:", materials);

const dbInfo = await prisma.$queryRaw`
  SELECT
    current_database() AS database,
    current_user AS user,
    current_schema() AS schema
`;

console.log("DATABASE INFO:", dbInfo);


      res.json({
        success: true,
        materials,
      });
    } catch (error) {
      console.error("Get materials error:", error);

      res.status(500).json({
        success: false,
        message: "साहित्य मिळवताना error आला.",
      });
    }
  };

  
  /* =====================================================
    CREATE MATERIAL
  ===================================================== */

  export const createMaterial = async (req, res) => {
    try {
      const { name, stock, rate } = req.body;

      if (!name || stock === undefined || rate === undefined) {
        return res.status(400).json({
          success: false,
          message: "साहित्याचे नाव, stock आणि rate आवश्यक आहेत.",
        });
      }

      const material = await prisma.material.create({
        data: {
          name: String(name).trim(),
          stock: Number(stock),
          rate: Number(rate),
        },
      });

      res.status(201).json({
        success: true,
        message: "साहित्य successfully add झाले.",
        material,
      });
    } catch (error) {
      console.error("Create material error:", error);

      if (error.code === "P2002") {
        return res.status(400).json({
          success: false,
          message: "हे साहित्य आधीपासून उपलब्ध आहे.",
        });
      }

      res.status(500).json({
        success: false,
        message: "साहित्य add करताना error आला.",
      });
    }
  };

  /* =====================================================
    UPDATE MATERIAL
  ===================================================== */

  export const updateMaterial = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, stock, rate } = req.body;

      const material = await prisma.material.update({
        where: {
          id: Number(id),
        },
        data: {
          ...(name !== undefined && {
            name: String(name).trim(),
          }),

          ...(stock !== undefined && {
            stock: Number(stock),
          }),

          ...(rate !== undefined && {
            rate: Number(rate),
          }),
        },
      });

      res.json({
        success: true,
        message: "साहित्य successfully update झाले.",
        material,
      });
    } catch (error) {
      console.error("Update material error:", error);

      res.status(500).json({
        success: false,
        message: "साहित्य update करताना error आला.",
      });
    }
  };

  /* =====================================================
    DELETE MATERIAL
  ===================================================== */

  export const deleteMaterial = async (req, res) => {
    try {
      const { id } = req.params;

      const materialId = Number(id);

      const bookingItem = await prisma.bookingItem.findFirst({
        where: {
          materialId,
        },
      });

      if (bookingItem) {
        return res.status(400).json({
          success: false,
          message:
            "हे साहित्य booking मध्ये वापरलेले आहे, त्यामुळे delete करता येणार नाही.",
        });
      }

      await prisma.material.delete({
        where: {
          id: materialId,
        },
      });

      res.json({
        success: true,
        message: "साहित्य successfully delete झाले.",
      });
    } catch (error) {
      console.error("Delete material error:", error);

      res.status(500).json({
        success: false,
        message: "साहित्य delete करताना error आला.",
      });
    }
  };