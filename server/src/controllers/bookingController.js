import prisma from "../config/prisma.js";
import axios from "axios";
import FormData from "form-data";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* =========================================================
   FILE PATH
========================================================= */

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const DEVANAGARI_FONT_PATH =
  path.join(
    __dirname,
    "../../fonts/NotoSansDevanagari-Regular.ttf"
  );

/* =========================================================
   PAYMENT STATUS
========================================================= */

const calculatePaymentStatus = (
  total,
  advance
) => {
  const totalAmount =
    Number(total || 0);

  const advanceAmount =
    Number(advance || 0);

  if (
    advanceAmount <= 0
  ) {
    return "PENDING";
  }

  if (
    advanceAmount >=
    totalAmount
  ) {
    return "PAID";
  }

  return "PARTIAL";
};

/* =========================================================
   RETURN STATUS
========================================================= */

const calculateReturnStatus = (
  items = []
) => {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return "PENDING";
  }

  const allComplete =
    items.every(
      (item) => {
        const quantity =
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

        return (
          returned + missing >=
          quantity
        );
      }
    );

  if (allComplete) {
    return "COMPLETE";
  }

  const anyReturnedOrMissing =
    items.some(
      (item) => {
        return (
          Number(
            item.returnedQuantity ||
              0
          ) > 0 ||
          Number(
            item.missingQuantity ||
              0
          ) > 0
        );
      }
    );

  if (
    anyReturnedOrMissing
  ) {
    return "PARTIAL";
  }

  return "PENDING";
};

/* =========================================================
   DATE HELPERS
========================================================= */

const parseDateOnly = (
  value
) => {
  if (!value) {
    return null;
  }

  const date =
    new Date(
      `${value}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
};

const validateBookingAndEventDate =
  (
    bookingDateValue,
    eventDateValue
  ) => {
    if (!bookingDateValue) {
      throw new Error(
        "Booking date is required."
      );
    }

    if (!eventDateValue) {
      throw new Error(
        "Event date is required."
      );
    }

    const bookingDate =
      parseDateOnly(
        bookingDateValue
      );

    const eventDate =
      parseDateOnly(
        eventDateValue
      );

    if (!bookingDate) {
      throw new Error(
        "Invalid booking date."
      );
    }

    if (!eventDate) {
      throw new Error(
        "Invalid event date."
      );
    }

    if (
      eventDate <
      bookingDate
    ) {
      throw new Error(
        "Event date cannot be before booking date."
      );
    }

    return {
      bookingDate,
      eventDate,
    };
  };

const getTodayStart =
  () => {
    const date =
      new Date();

    date.setHours(
      0,
      0,
      0,
      0
    );

    return date;
  };

const getTomorrowStart =
  () => {
    const date =
      getTodayStart();

    date.setDate(
      date.getDate() + 1
    );

    return date;
  };

const getUpcomingEndDate =
  (days = 7) => {
    const date =
      getTodayStart();

    date.setDate(
      date.getDate() + days
    );

    return date;
  };

/* =========================================================
   BOOKING INCLUDE

   Admin tracking फक्त application/history साठी.
   PDF मध्ये हे relation वापरणार नाही.
========================================================= */

const getBookingInclude = {
  customer: true,

  admin: true,

  pickedUpByAdmin: true,

  returnByAdmin: true,

  items: {
    include: {
      material: true,
    },

    orderBy: {
      id: "asc",
    },
  },
};

/* =========================================================
   GENERATE NEXT BILL NUMBER

   जुने:
   BK-01
   BK-02

   नवीन:
   01
   02
   03
========================================================= */

const generateNextBookingNumber =
  async (
    tx = prisma
  ) => {
    const bookings =
      await tx.booking.findMany({
        select: {
          bookingNumber: true,
        },
      });

    let maxNumber = 0;

    for (
      const booking of bookings
    ) {
      const rawNumber =
        String(
          booking.bookingNumber ||
            ""
        ).trim();

      const match =
        rawNumber.match(
          /^(?:BK-)?(\d+)$/
        );

      if (!match) {
        continue;
      }

      const number =
        Number(match[1]);

      if (
        Number.isInteger(
          number
        ) &&
        number > maxNumber
      ) {
        maxNumber =
          number;
      }
    }

    const nextNumber =
      maxNumber + 1;

    return String(
      nextNumber
    ).padStart(
      2,
      "0"
    );
  };

/* =========================================================
   NORMALIZE MATERIALS
========================================================= */

const normalizeMaterials =
  (materials) => {
    if (
      !Array.isArray(
        materials
      )
    ) {
      throw new Error(
        "Materials must be an array."
      );
    }

    return materials.map(
      (item) => ({
        bookingItemId:
          item.bookingItemId !==
            undefined &&
          item.bookingItemId !==
            null &&
          item.bookingItemId !==
            ""
            ? Number(
                item.bookingItemId
              )
            : null,

        materialId:
          Number(
            item.materialId ??
              item.id
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
    );
  };

/* =========================================================
   VALIDATE MATERIALS
========================================================= */

const validateMaterials =
  (materials) => {
    for (
      const item of materials
    ) {
      if (
        !Number.isInteger(
          item.materialId
        ) ||
        item.materialId <= 0
      ) {
        throw new Error(
          "Invalid material."
        );
      }

      if (
        !Number.isInteger(
          item.quantity
        ) ||
        item.quantity <= 0
      ) {
        throw new Error(
          "Quantity must be greater than 0."
        );
      }

      if (
        !Number.isFinite(
          item.rate
        ) ||
        item.rate < 0
      ) {
        throw new Error(
          "Invalid material rate."
        );
      }
    }
  };

/* =========================================================
   CREATE BOOKING
   POST /api/bookings
========================================================= */

export const createBooking =
  async (
    req,
    res
  ) => {
    try {
      const {
        bookingDate,
        eventDate,
        customer,
        materials,
        advance = 0,
        adminId,
      } = req.body;

      /* =====================================================
         CUSTOMER
      ===================================================== */

      if (
        !customer?.name?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Customer name is required.",
        });
      }

      if (
        !customer?.mobile?.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Customer mobile is required.",
        });
      }

      /* =====================================================
         DATE
      ===================================================== */

      let dates;

      try {
        dates =
          validateBookingAndEventDate(
            bookingDate,
            eventDate
          );
      } catch (
        error
      ) {
        return res.status(400).json({
          success: false,
          message:
            error.message,
        });
      }

      /* =====================================================
         MATERIAL
      ===================================================== */

      if (
        !Array.isArray(
          materials
        ) ||
        materials.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "At least one material is required.",
        });
      }

      const advanceAmount =
        Math.max(
          Number(
            advance
          ) || 0,
          0
        );

      const result =
        await prisma.$transaction(
          async (tx) => {

            /* ===============================================
               BILL NUMBER
            =============================================== */

            const bookingNumber =
              await generateNextBookingNumber(
                tx
              );

            /* ===============================================
               NORMALIZE
            =============================================== */

            const normalizedMaterials =
              normalizeMaterials(
                materials
              );

            validateMaterials(
              normalizedMaterials
            );

            /* ===============================================
               CUSTOMER
            =============================================== */

            const mobile =
              customer.mobile.trim();

            const existingCustomer =
              await tx.customer.findFirst({
                where: {
                  mobile,
                },
              });

            let customerRecord;

            if (
              existingCustomer
            ) {
              customerRecord =
                await tx.customer.update({
                  where: {
                    id:
                      existingCustomer.id,
                  },

                  data: {
                    name:
                      customer.name.trim(),

                    mobile,

                    address:
                      customer.address?.trim() ||
                      null,
                  },
                });
            } else {
              customerRecord =
                await tx.customer.create({
                  data: {
                    name:
                      customer.name.trim(),

                    mobile,

                    address:
                      customer.address?.trim() ||
                      null,
                  },
                });
            }

            /* ===============================================
               ADMIN
            =============================================== */

            let adminRecord =
              null;

            if (
              adminId !==
                undefined &&
              adminId !== null &&
              adminId !== ""
            ) {
              const parsedAdminId =
                Number(
                  adminId
                );

              if (
                !Number.isInteger(
                  parsedAdminId
                ) ||
                parsedAdminId <= 0
              ) {
                throw new Error(
                  "Invalid admin ID."
                );
              }

              adminRecord =
                await tx.admin.findUnique({
                  where: {
                    id:
                      parsedAdminId,
                  },
                });

              if (
                !adminRecord ||
                !adminRecord.isActive
              ) {
                throw new Error(
                  "Selected admin is not available."
                );
              }
            }

            /* ===============================================
               MATERIAL IDS
            =============================================== */

            const materialIds =
              [
                ...new Set(
                  normalizedMaterials.map(
                    (item) =>
                      item.materialId
                  )
                ),
              ];

            const materialRecords =
              await tx.material.findMany({
                where: {
                  id: {
                    in:
                      materialIds,
                  },
                },
              });

            if (
              materialRecords.length !==
              materialIds.length
            ) {
              throw new Error(
                "One or more materials not found."
              );
            }

            const materialMap =
              new Map(
                materialRecords.map(
                  (material) => [
                    material.id,
                    material,
                  ]
                )
              );

            /* ===============================================
               STOCK CHECK
            =============================================== */

            for (
              const item of
                normalizedMaterials
            ) {
              const material =
                materialMap.get(
                  item.materialId
                );

              if (!material) {
                throw new Error(
                  "Material not found."
                );
              }

              if (
                Number(
                  material.stock
                ) <
                item.quantity
              ) {
                throw new Error(
                  `${material.name} चा पुरेसा stock उपलब्ध नाही. Available: ${material.stock}`
                );
              }
            }

            /* ===============================================
               TOTAL
            =============================================== */

            const totalQuantity =
              normalizedMaterials.reduce(
                (
                  sum,
                  item
                ) =>
                  sum +
                  item.quantity,
                0
              );

            const totalAmount =
              normalizedMaterials.reduce(
                (
                  sum,
                  item
                ) =>
                  sum +
                  item.quantity *
                    item.rate,
                0
              );

            if (
              advanceAmount >
              totalAmount
            ) {
              throw new Error(
                "Advance cannot be greater than total amount."
              );
            }

            const remainingAmount =
              totalAmount -
              advanceAmount;

            const paymentStatus =
              calculatePaymentStatus(
                totalAmount,
                advanceAmount
              );

            /* ===============================================
               CREATE BOOKING
            =============================================== */

            const booking =
              await tx.booking.create({
                data: {
                  bookingNumber,

                  bookingDate:
                    dates.bookingDate,

                  eventDate:
                    dates.eventDate,

                  totalQuantity,

                  totalAmount,

                  advanceAmount,

                  remainingAmount,

                  paymentStatus,

                  bookingStatus:
                    "ACTIVE",

                  returnStatus:
                    "PENDING",

                  orderProgress:
                    "BOOKED",

                  adminId:
                    adminRecord?.id ||
                    null,

                  pickedUpByAdminId:
                    null,

                  pickedUpAt:
                    null,

                  returnByAdminId:
                    null,

                  returnedAt:
                    null,

                  customerId:
                    customerRecord.id,

                  items: {
                    create:
                      normalizedMaterials.map(
                        (item) => ({
                          materialId:
                            item.materialId,

                          quantity:
                            item.quantity,

                          rate:
                            item.rate,

                          amount:
                            item.quantity *
                            item.rate,

                          returnedQuantity:
                            0,

                          missingQuantity:
                            0,
                        })
                      ),
                  },
                },

                include:
                  getBookingInclude,
              });

            /* ===============================================
               REDUCE STOCK
            =============================================== */

            for (
              const item of
                normalizedMaterials
            ) {
              await tx.material.update({
                where: {
                  id:
                    item.materialId,
                },

                data: {
                  stock: {
                    decrement:
                      item.quantity,
                  },
                },
              });
            }

            return booking;
          }
        );

      return res.status(201).json({
        success: true,

        message:
          "Booking created successfully.",

        booking: result,
      });
    } catch (
      error
    ) {
      console.error(
        "CREATE BOOKING ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Failed to create booking.",
      });
    }
  };
  /* =========================================================
   GET ALL BOOKINGS
========================================================= */

export const getBookings =
  async (
    req,
    res
  ) => {
    try {
      const bookings =
        await prisma.booking.findMany({
          include:
            getBookingInclude,

          orderBy: {
            id: "desc",
          },
        });

      return res.json({
        success: true,
        bookings,
      });
    } catch (
      error
    ) {
      console.error(
        "GET BOOKINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch bookings.",
      });
    }
  };

/* =========================================================
   GET PENDING / UPCOMING ORDERS
========================================================= */

export const getPendingOrders =
  async (
    req,
    res
  ) => {
    try {
      const today =
        getTodayStart();

      const bookings =
        await prisma.booking.findMany({
          where: {
            bookingStatus:
              "ACTIVE",

            eventDate: {
              gte: today,
            },
          },

          include:
            getBookingInclude,

          orderBy: [
            {
              eventDate:
                "asc",
            },

            {
              id: "desc",
            },
          ],
        });

      return res.json({
        success: true,

        count:
          bookings.length,

        bookings,
      });
    } catch (
      error
    ) {
      console.error(
        "GET PENDING ORDERS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch pending orders.",
      });
    }
  };

/* =========================================================
   BOOKING NOTIFICATIONS
========================================================= */

export const getBookingNotifications =
  async (
    req,
    res
  ) => {
    try {
      const today =
        getTodayStart();

      const tomorrow =
        getTomorrowStart();

      const upcomingEndDate =
        getUpcomingEndDate(
          7
        );

      /* ================================================
         PENDING BOOKINGS
      ================================================ */

      const pendingCount =
        await prisma.booking.count({
          where: {
            bookingStatus:
              "ACTIVE",

            eventDate: {
              gte: today,
            },
          },
        });

      /* ================================================
         TODAY
      ================================================ */

      const todayBookings =
        await prisma.booking.findMany({
          where: {
            bookingStatus:
              "ACTIVE",

            eventDate: {
              gte: today,

              lt: tomorrow,
            },
          },

          include:
            getBookingInclude,

          orderBy: {
            eventDate:
              "asc",
          },
        });

      /* ================================================
         TOMORROW
      ================================================ */

      const tomorrowEnd =
        new Date(
          tomorrow
        );

      tomorrowEnd.setDate(
        tomorrowEnd.getDate() +
          1
      );

      const tomorrowBookings =
        await prisma.booking.findMany({
          where: {
            bookingStatus:
              "ACTIVE",

            eventDate: {
              gte: tomorrow,

              lt:
                tomorrowEnd,
            },
          },

          include:
            getBookingInclude,

          orderBy: {
            eventDate:
              "asc",
          },
        });

      /* ================================================
         UPCOMING 7 DAYS
      ================================================ */

      const upcomingBookings =
        await prisma.booking.findMany({
          where: {
            bookingStatus:
              "ACTIVE",

            eventDate: {
              gte: today,

              lte:
                upcomingEndDate,
            },
          },

          include:
            getBookingInclude,

          orderBy: {
            eventDate:
              "asc",
          },

          take: 10,
        });

      return res.json({
        success: true,

        notifications: {
          pendingCount,

          todayCount:
            todayBookings.length,

          tomorrowCount:
            tomorrowBookings.length,

          upcomingCount:
            upcomingBookings.length,
        },

        todayBookings,

        tomorrowBookings,

        upcomingBookings,
      });
    } catch (
      error
    ) {
      console.error(
        "BOOKING NOTIFICATIONS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch booking notifications.",
      });
    }
  };

/* =========================================================
   GET SINGLE BOOKING
========================================================= */

export const getBookingById =
  async (
    req,
    res
  ) => {
    try {
      const bookingId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          bookingId
        ) ||
        bookingId <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid booking ID.",
        });
      }

      const booking =
        await prisma.booking.findUnique({
          where: {
            id: bookingId,
          },

          include:
            getBookingInclude,
        });

      if (!booking) {
        return res.status(404).json({
          success: false,

          message:
            "Booking not found.",
        });
      }

      return res.json({
        success: true,

        booking,
      });
    } catch (
      error
    ) {
      console.error(
        "GET BOOKING ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to fetch booking.",
      });
    }
  };

/* =========================================================
   UPDATE BOOKING
   PUT /api/bookings/:id
   PATCH /api/bookings/:id
========================================================= */

export const updateBooking =
  async (
    req,
    res
  ) => {
    try {
      const bookingId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          bookingId
        ) ||
        bookingId <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid booking ID.",
        });
      }

      const {
        customer,
        bookingDate,
        eventDate,
        materials,
        advance = 0,
      } = req.body;

      /* ================================================
         CUSTOMER
      ================================================ */

      if (
        !customer?.name?.trim()
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Customer name is required.",
        });
      }

      if (
        !customer?.mobile?.trim()
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Customer mobile is required.",
        });
      }

      /* ================================================
         DATE
      ================================================ */

      let dates;

      try {
        dates =
          validateBookingAndEventDate(
            bookingDate,
            eventDate
          );
      } catch (
        error
      ) {
        return res.status(400).json({
          success: false,

          message:
            error.message,
        });
      }

      /* ================================================
         MATERIAL
      ================================================ */

      if (
        !Array.isArray(
          materials
        ) ||
        materials.length === 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "At least one material is required.",
        });
      }

      const newAdvance =
        Math.max(
          Number(
            advance
          ) || 0,
          0
        );

      const result =
        await prisma.$transaction(
          async (
            tx
          ) => {
            /* ==========================================
               OLD BOOKING
            ========================================== */

            const oldBooking =
              await tx.booking.findUnique({
                where: {
                  id:
                    bookingId,
                },

                include: {
                  items: true,

                  customer: true,

                  admin: true,
                },
              });

            if (!oldBooking) {
              throw new Error(
                "Booking not found."
              );
            }

            if (
              oldBooking.bookingStatus ===
              "CANCELLED"
            ) {
              throw new Error(
                "Cancelled booking cannot be edited."
              );
            }

            /* ==========================================
               NEW ITEMS
            ========================================== */

            const newItems =
              normalizeMaterials(
                materials
              );

            validateMaterials(
              newItems
            );

            /* ==========================================
               OLD ITEM MAP
            ========================================== */

            const oldItemMap =
              new Map(
                oldBooking.items.map(
                  (
                    item
                  ) => [
                    item.id,
                    item,
                  ]
                )
              );

            /* ==========================================
               MATERIAL IDS
            ========================================== */

            const allMaterialIds =
              [
                ...new Set([
                  ...oldBooking.items.map(
                    (
                      item
                    ) =>
                      item.materialId
                  ),

                  ...newItems.map(
                    (
                      item
                    ) =>
                      item.materialId
                  ),
                ]),
              ];

            const materialRecords =
              await tx.material.findMany({
                where: {
                  id: {
                    in:
                      allMaterialIds,
                  },
                },
              });

            if (
              materialRecords.length !==
              allMaterialIds.length
            ) {
              throw new Error(
                "One or more materials not found."
              );
            }

            const materialMap =
              new Map(
                materialRecords.map(
                  (
                    material
                  ) => [
                    material.id,
                    material,
                  ]
                )
              );

            /* ==========================================
               STOCK CHANGES
            ========================================== */

            const stockChanges =
              new Map();

            const addStockChange =
              (
                materialId,
                change
              ) => {
                stockChanges.set(
                  materialId,

                  (
                    stockChanges.get(
                      materialId
                    ) || 0
                  ) +
                    change
                );
              };

            const processedOldItems =
              new Set();

            /* ==========================================
               PROCESS NEW ITEMS
            ========================================== */

            for (
              const newItem of newItems
            ) {
              const material =
                materialMap.get(
                  newItem.materialId
                );

              if (!material) {
                throw new Error(
                  "Material not found."
                );
              }

              /* EXISTING ITEM */

              if (
                newItem.bookingItemId &&
                oldItemMap.has(
                  newItem.bookingItemId
                )
              ) {
                const oldItem =
                  oldItemMap.get(
                    newItem.bookingItemId
                  );

                processedOldItems.add(
                  oldItem.id
                );

                const alreadyReturned =
                  Number(
                    oldItem.returnedQuantity ||
                      0
                  ) +
                  Number(
                    oldItem.missingQuantity ||
                      0
                  );

                if (
                  newItem.quantity <
                  alreadyReturned
                ) {
                  throw new Error(
                    `${material.name} quantity cannot be less than returned/missing quantity.`
                  );
                }

                /* MATERIAL CHANGED */

                if (
                  oldItem.materialId !==
                  newItem.materialId
                ) {
                  addStockChange(
                    oldItem.materialId,
                    oldItem.quantity
                  );

                  addStockChange(
                    newItem.materialId,
                    -newItem.quantity
                  );
                } else {
                  /* SAME MATERIAL */

                  const difference =
                    newItem.quantity -
                    oldItem.quantity;

                  addStockChange(
                    newItem.materialId,
                    -difference
                  );
                }
              } else {
                /* NEW ITEM */

                addStockChange(
                  newItem.materialId,
                  -newItem.quantity
                );
              }
            }

            /* ==========================================
               REMOVED OLD ITEMS
            ========================================== */

            for (
              const oldItem of
                oldBooking.items
            ) {
              if (
                processedOldItems.has(
                  oldItem.id
                )
              ) {
                continue;
              }

              const alreadyReturned =
                Number(
                  oldItem.returnedQuantity ||
                    0
                ) +
                Number(
                  oldItem.missingQuantity ||
                    0
                );

              if (
                alreadyReturned > 0
              ) {
                throw new Error(
                  "Material already returned/missing cannot be removed from booking."
                );
              }

              addStockChange(
                oldItem.materialId,
                oldItem.quantity
              );
            }

            /* ==========================================
               STOCK VALIDATION
            ========================================== */

            for (
              const [
                materialId,
                change,
              ] of stockChanges
            ) {
              if (
                change >= 0
              ) {
                continue;
              }

              const material =
                materialMap.get(
                  materialId
                );

              const required =
                Math.abs(
                  change
                );

              if (
                Number(
                  material.stock
                ) <
                required
              ) {
                throw new Error(
                  `${material.name} चा पुरेसा stock उपलब्ध नाही. Available: ${material.stock}`
                );
              }
            }

            /* ==========================================
               TOTALS
            ========================================== */

            const totalQuantity =
              newItems.reduce(
                (
                  sum,
                  item
                ) =>
                  sum +
                  item.quantity,
                0
              );

            const totalAmount =
              newItems.reduce(
                (
                  sum,
                  item
                ) =>
                  sum +
                  item.quantity *
                    item.rate,
                0
              );

            if (
              newAdvance >
              totalAmount
            ) {
              throw new Error(
                "Advance cannot be greater than total amount."
              );
            }

            const remainingAmount =
              totalAmount -
              newAdvance;

            const paymentStatus =
              calculatePaymentStatus(
                totalAmount,
                newAdvance
              );

            /* ==========================================
               UPDATE CUSTOMER
            ========================================== */

            await tx.customer.update({
              where: {
                id:
                  oldBooking.customerId,
              },

              data: {
                name:
                  customer.name.trim(),

                mobile:
                  customer.mobile.trim(),

                address:
                  customer.address?.trim() ||
                  null,
              },
            });

            /* ==========================================
               UPDATE BOOKING
               
               IMPORTANT:
               Existing admin preserved.
            ========================================== */

            await tx.booking.update({
              where: {
                id:
                  bookingId,
              },

              data: {
                bookingDate:
                  dates.bookingDate,

                eventDate:
                  dates.eventDate,

                totalQuantity,

                totalAmount,

                advanceAmount:
                  newAdvance,

                remainingAmount,

                paymentStatus,
              },
            });

            /* ==========================================
               DELETE OLD ITEMS
            ========================================== */

            await tx.bookingItem.deleteMany({
              where: {
                bookingId,
              },
            });

            /* ==========================================
               CREATE NEW ITEMS
            ========================================== */

            await tx.bookingItem.createMany({
              data:
                newItems.map(
                  (
                    item
                  ) => {
                    const oldItem =
                      item.bookingItemId
                        ? oldItemMap.get(
                            item.bookingItemId
                          )
                        : null;

                    return {
                      bookingId,

                      materialId:
                        item.materialId,

                      quantity:
                        item.quantity,

                      rate:
                        item.rate,

                      amount:
                        item.quantity *
                        item.rate,

                      returnedQuantity:
                        oldItem
                          ? Number(
                              oldItem.returnedQuantity ||
                                0
                            )
                          : 0,

                      missingQuantity:
                        oldItem
                          ? Number(
                              oldItem.missingQuantity ||
                                0
                            )
                          : 0,
                    };
                  }
                ),
            });

            /* ==========================================
               UPDATE STOCK
            ========================================== */

            for (
              const [
                materialId,
                change,
              ] of stockChanges
            ) {
              if (
                change === 0
              ) {
                continue;
              }

              if (
                change > 0
              ) {
                await tx.material.update({
                  where: {
                    id:
                      materialId,
                  },

                  data: {
                    stock: {
                      increment:
                        change,
                    },
                  },
                });
              } else {
                await tx.material.update({
                  where: {
                    id:
                      materialId,
                  },

                  data: {
                    stock: {
                      decrement:
                        Math.abs(
                          change
                        ),
                    },
                  },
                });
              }
            }

            /* ==========================================
               FINAL ITEMS
            ========================================== */

            const finalItems =
              await tx.bookingItem.findMany({
                where: {
                  bookingId,
                },
              });

            const returnStatus =
              calculateReturnStatus(
                finalItems
              );

            await tx.booking.update({
              where: {
                id:
                  bookingId,
              },

              data: {
                returnStatus,

                bookingStatus:
                  returnStatus ===
                  "COMPLETE"
                    ? "COMPLETED"
                    : "ACTIVE",
              },
            });

            /* ==========================================
               FINAL BOOKING
            ========================================== */

            return tx.booking.findUnique({
              where: {
                id:
                  bookingId,
              },

              include:
                getBookingInclude,
            });
          }
        );

      return res.json({
        success: true,

        message:
          "Booking updated successfully.",

        booking:
          result,
      });
    } catch (
      error
    ) {
      console.error(
        "UPDATE BOOKING ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Failed to update booking.",
      });
    }
  };
  /* =========================================================
   UPDATE PAYMENT
   PATCH /api/bookings/:id/payment
========================================================= */

export const updatePayment =
  async (
    req,
    res
  ) => {
    try {
      const bookingId =
        Number(
          req.params.id
        );

      const amount =
        Number(
          req.body.amount
        );

      /* ================================================
         VALIDATE BOOKING ID
      ================================================ */

      if (
        !Number.isInteger(
          bookingId
        ) ||
        bookingId <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid booking ID.",
        });
      }

      /* ================================================
         VALIDATE AMOUNT
      ================================================ */

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Payment amount must be greater than 0.",
        });
      }

      /* ================================================
         GET BOOKING
      ================================================ */

      const booking =
        await prisma.booking.findUnique({
          where: {
            id:
              bookingId,
          },
        });

      if (!booking) {
        return res.status(404).json({
          success: false,

          message:
            "Booking not found.",
        });
      }

      /* ================================================
         REMAINING
      ================================================ */

      const remainingAmount =
        Number(
          booking.remainingAmount ||
            0
        );

      if (
        amount >
        remainingAmount
      ) {
        return res.status(400).json({
          success: false,

          message:
            `Payment cannot exceed remaining amount ₹${remainingAmount}.`,
        });
      }

      /* ================================================
         NEW PAYMENT TOTAL
      ================================================ */

      const newAdvance =
        Number(
          booking.advanceAmount ||
            0
        ) +
        amount;

      const newRemaining =
        Number(
          booking.totalAmount ||
            0
        ) -
        newAdvance;

      const paymentStatus =
        calculatePaymentStatus(
          Number(
            booking.totalAmount ||
              0
          ),
          newAdvance
        );

      /* ================================================
         UPDATE
      ================================================ */

      const updatedBooking =
        await prisma.booking.update({
          where: {
            id:
              bookingId,
          },

          data: {
            advanceAmount:
              newAdvance,

            remainingAmount:
              newRemaining,

            paymentStatus,
          },

          include:
            getBookingInclude,
        });

      return res.json({
        success: true,

        message:
          "Payment updated successfully.",

        booking:
          updatedBooking,
      });
    } catch (
      error
    ) {
      console.error(
        "PAYMENT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Failed to update payment.",
      });
    }
  };

/* =========================================================
   PICKUP MATERIAL

   PATCH /api/bookings/:id/pickup

   ग्राहकाने booking मधील साहित्य घेतले.
========================================================= */

export const pickupMaterial =
  async (
    req,
    res
  ) => {
    try {
      const bookingId =
        Number(
          req.params.id
        );

      const adminId =
        Number(
          req.body.adminId
        );

      /* ================================================
         VALIDATE BOOKING
      ================================================ */

      if (
        !Number.isInteger(
          bookingId
        ) ||
        bookingId <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid booking ID.",
        });
      }

      /* ================================================
         VALIDATE ADMIN
      ================================================ */

      if (
        !Number.isInteger(
          adminId
        ) ||
        adminId <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Valid admin ID is required.",
        });
      }

      /* ================================================
         TRANSACTION
      ================================================ */

      const result =
        await prisma.$transaction(
          async (
            tx
          ) => {
            const booking =
              await tx.booking.findUnique({
                where: {
                  id:
                    bookingId,
                },
              });

            if (!booking) {
              throw new Error(
                "Booking not found."
              );
            }

            if (
              booking.bookingStatus ===
              "CANCELLED"
            ) {
              throw new Error(
                "Cancelled booking cannot be picked up."
              );
            }

            /* ==========================================
               ADMIN
            ========================================== */

            const admin =
              await tx.admin.findUnique({
                where: {
                  id:
                    adminId,
                },
              });

            if (
              !admin ||
              !admin.isActive
            ) {
              throw new Error(
                "Selected admin is not available."
              );
            }

            /* ==========================================
               ALREADY RETURNED
            ========================================== */

            if (
              booking.orderProgress ===
              "RETURNED"
            ) {
              throw new Error(
                "This booking is already returned."
              );
            }

            /* ==========================================
               UPDATE PICKUP
            ========================================== */

            const updatedBooking =
              await tx.booking.update({
                where: {
                  id:
                    bookingId,
                },

                data: {
                  orderProgress:
                    "PICKED_UP",

                  pickedUpByAdminId:
                    adminId,

                  pickedUpAt:
                    new Date(),
                },

                include:
                  getBookingInclude,
              });

            return updatedBooking;
          }
        );

      return res.json({
        success: true,

        message:
          "Booking picked up successfully.",

        booking:
          result,
      });
    } catch (
      error
    ) {
      console.error(
        "PICKUP ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Failed to mark booking as picked up.",
      });
    }
  };

/* =========================================================
   RETURN MATERIAL

   PATCH /api/bookings/:id/return

   BODY:

   {
     "adminId": 1,
     "items": [
       {
         "bookingItemId": 10,
         "missingQuantity": 0
       }
     ]
   }

   RETURN STATUS:
   PENDING
   PARTIAL
   COMPLETE

   ORDER PROGRESS:
   BOOKED
   PICKED_UP
   PARTIAL_RETURN
   RETURNED
========================================================= */

export const returnMaterial =
  async (
    req,
    res
  ) => {
    try {
      /* ================================================
         BOOKING ID
      ================================================ */

      const bookingId =
        Number(
          req.params.id
        );

      /* ================================================
         REQUEST BODY
      ================================================ */

      const {
        items,
        adminId,
      } = req.body;

      /* ================================================
         BOOKING VALIDATION
      ================================================ */

      if (
        !Number.isInteger(
          bookingId
        ) ||
        bookingId <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid booking ID.",
        });
      }

      /* ================================================
         ADMIN VALIDATION
      ================================================ */

      const returnAdminId =
        Number(
          adminId
        );

      if (
        !Number.isInteger(
          returnAdminId
        ) ||
        returnAdminId <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Valid admin ID is required.",
        });
      }

      /* ================================================
         ITEMS VALIDATION
      ================================================ */

      if (
        !Array.isArray(
          items
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Return items are required.",
        });
      }

      if (
        items.length === 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "किमान एक साहित्य निवडा.",
        });
      }

      /* ================================================
         TRANSACTION
      ================================================ */

      const result =
        await prisma.$transaction(
          async (
            tx
          ) => {

            /* ==========================================
               GET BOOKING
            ========================================== */

            const booking =
              await tx.booking.findUnique({
                where: {
                  id:
                    bookingId,
                },

                include: {
                  items:
                    true,
                },
              });

            if (!booking) {
              throw new Error(
                "Booking not found."
              );
            }

            /* ==========================================
               CANCELLED CHECK
            ========================================== */

            if (
              booking.bookingStatus ===
              "CANCELLED"
            ) {
              throw new Error(
                "Cancelled booking cannot be returned."
              );
            }

            /* ==========================================
               RETURN ADMIN
            ========================================== */

            const returnAdmin =
              await tx.admin.findUnique({
                where: {
                  id:
                    returnAdminId,
                },
              });

            if (
              !returnAdmin ||
              !returnAdmin.isActive
            ) {
              throw new Error(
                "Selected admin is not available."
              );
            }

            /* ==========================================
               PREVENT COMPLETE AGAIN
            ========================================== */

            if (
              booking.orderProgress ===
              "RETURNED"
            ) {
              throw new Error(
                "या booking चे सर्व साहित्य आधीच परत आले आहे."
              );
            }

            /* ==========================================
               PROCESS ITEMS
            ========================================== */

            for (
              const inputItem of items
            ) {

              const bookingItem =
                booking.items.find(
                  (
                    item
                  ) =>
                    item.id ===
                    Number(
                      inputItem.bookingItemId
                    )
                );

              if (!bookingItem) {
                throw new Error(
                  "Booking item not found."
                );
              }

              /* ========================================
                 MISSING
              ======================================== */

              const missingQuantity =
                Number(
                  inputItem.missingQuantity
                ) || 0;

              if (
                !Number.isInteger(
                  missingQuantity
                ) ||
                missingQuantity < 0
              ) {
                throw new Error(
                  "Invalid missing quantity."
                );
              }

              if (
                missingQuantity >
                bookingItem.quantity
              ) {
                throw new Error(
                  "Missing quantity cannot exceed booking quantity."
                );
              }

              /* ========================================
                 RETURNED
              ======================================== */

              const returnedQuantity =
                bookingItem.quantity -
                missingQuantity;

              /* ========================================
                 OLD VALUES
              ======================================== */

              const oldReturned =
                Number(
                  bookingItem.returnedQuantity ||
                    0
                );

              const oldMissing =
                Number(
                  bookingItem.missingQuantity ||
                    0
                );

              /* ========================================
                 PREVENT REDUCTION
              ======================================== */

              if (
                returnedQuantity <
                oldReturned
              ) {
                throw new Error(
                  "Returned quantity cannot be reduced."
                );
              }

              if (
                missingQuantity <
                oldMissing
              ) {
                throw new Error(
                  "Missing quantity cannot be reduced."
                );
              }

              /* ========================================
                 TOTAL ACCOUNTED
              ======================================== */

              const totalAccountedQuantity =
                returnedQuantity +
                missingQuantity;

              if (
                totalAccountedQuantity >
                bookingItem.quantity
              ) {
                throw new Error(
                  "Returned + missing quantity cannot exceed booking quantity."
                );
              }

              /* ========================================
                 ADDITIONAL RETURNED
              ======================================== */

              const additionalReturned =
                Math.max(
                  returnedQuantity -
                    oldReturned,
                  0
                );

              /* ========================================
                 UPDATE ITEM
              ======================================== */

              await tx.bookingItem.update({
                where: {
                  id:
                    bookingItem.id,
                },

                data: {
                  returnedQuantity,

                  missingQuantity,
                },
              });

              /* ========================================
                 RETURN STOCK
              ======================================== */

              if (
                additionalReturned >
                0
              ) {
                await tx.material.update({
                  where: {
                    id:
                      bookingItem.materialId,
                  },

                  data: {
                    stock: {
                      increment:
                        additionalReturned,
                    },
                  },
                });
              }
            }

            /* ==========================================
               FINAL ITEMS
            ========================================== */

            const updatedItems =
              await tx.bookingItem.findMany({
                where: {
                  bookingId,
                },
              });

            /* ==========================================
               RETURN STATUS
            ========================================== */

            const returnStatus =
              calculateReturnStatus(
                updatedItems
              );

            /* ==========================================
               ORDER PROGRESS
            ========================================== */

            let orderProgress =
              booking.orderProgress;

            if (
              returnStatus ===
              "COMPLETE"
            ) {
              orderProgress =
                "RETURNED";
            } else if (
              returnStatus ===
              "PARTIAL"
            ) {
              orderProgress =
                "PARTIAL_RETURN";
            } else if (
              booking.orderProgress ===
              "BOOKED"
            ) {
              orderProgress =
                "BOOKED";
            } else {
              orderProgress =
                "PICKED_UP";
            }

            /* ==========================================
               BOOKING STATUS
            ========================================== */

            const bookingStatus =
              returnStatus ===
              "COMPLETE"
                ? "COMPLETED"
                : "ACTIVE";

            /* ==========================================
               UPDATE BOOKING
            ========================================== */

            const updatedBooking =
              await tx.booking.update({
                where: {
                  id:
                    bookingId,
                },

                data: {
                  returnStatus,

                  orderProgress,

                  bookingStatus,

                  returnByAdminId:
                    returnAdminId,

                  returnedAt:
                    new Date(),
                },

                include:
                  getBookingInclude,
              });

            return updatedBooking;
          }
        );

      return res.json({
        success: true,

        message:
          "Material return updated successfully.",

        booking:
          result,
      });
    } catch (
      error
    ) {
      console.error(
        "RETURN ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Failed to update return.",
      });
    }
  };

/* =========================================================
   DELETE BOOKING
   DELETE /api/bookings/:id
========================================================= */

export const deleteBooking =
  async (
    req,
    res
  ) => {
    try {
      const bookingId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          bookingId
        ) ||
        bookingId <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid booking ID.",
        });
      }

      await prisma.$transaction(
        async (
          tx
        ) => {

          /* ================================================
             GET BOOKING
          ================================================ */

          const booking =
            await tx.booking.findUnique({
              where: {
                id:
                  bookingId,
              },

              include: {
                items:
                  true,
              },
            });

          if (!booking) {
            throw new Error(
              "Booking not found."
            );
          }

          /* ================================================
             RETURN OUTSTANDING STOCK
          ================================================ */

          for (
            const item of
              booking.items
          ) {
            const outstanding =
              Number(
                item.quantity || 0
              ) -
              Number(
                item.returnedQuantity ||
                  0
              ) -
              Number(
                item.missingQuantity ||
                  0
              );

            if (
              outstanding > 0
            ) {
              await tx.material.update({
                where: {
                  id:
                    item.materialId,
                },

                data: {
                  stock: {
                    increment:
                      outstanding,
                  },
                },
              });
            }
          }

          /* ================================================
             DELETE
          ================================================ */

          await tx.booking.delete({
            where: {
              id:
                bookingId,
            },
          });
        }
      );

      return res.json({
        success: true,

        message:
          "Booking deleted successfully.",
      });
    } catch (
      error
    ) {
      console.error(
        "DELETE BOOKING ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Failed to delete booking.",
      });
    }
  };
  /* =========================================================
   WHATSAPP NUMBER
========================================================= */

const normalizeWhatsAppNumber = (
  mobile
) => {
  if (!mobile) {
    return null;
  }

  let number =
    String(mobile)
      .replace(
        /\D/g,
        ""
      );

  /* भारताचा country code */

  if (
    number.length === 10
  ) {
    number =
      `91${number}`;
  }

  if (
    number.length === 12 &&
    number.startsWith("91")
  ) {
    return number;
  }

  return null;
};

/* =========================================================
   FORMAT BILL DATE
========================================================= */

const formatBillDate = (
  date
) => {
  if (!date) {
    return "-";
  }

  const d =
    new Date(date);

  if (
    Number.isNaN(
      d.getTime()
    )
  ) {
    return "-";
  }

  return d.toLocaleDateString(
    "mr-IN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
};

/* =========================================================
   CREATE BILL PDF BUFFER
========================================================= */

const createBillPDF =
  async (
    booking
  ) => {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        try {

          /* ==============================================
             FONT CHECK
          ============================================== */

          if (
            !fs.existsSync(
              DEVANAGARI_FONT_PATH
            )
          ) {
            return reject(
              new Error(
                `NotoSansDevanagari-Regular.ttf font not found at: ${DEVANAGARI_FONT_PATH}`
              )
            );
          }

          /* ==============================================
             PDF DOCUMENT
          ============================================== */

          const doc =
            new PDFDocument({
              size: "A4",

              margin: 40,

              info: {
                Title:
                  `Bill ${booking.bookingNumber}`,

                Author:
                  "OM SAI CETERS",

                Subject:
                  "ग्राहक बिल",
              },
            });

          /* ==============================================
             PDF BUFFER
          ============================================== */

          const chunks = [];

          doc.on(
            "data",
            (chunk) => {
              chunks.push(
                chunk
              );
            }
          );

          doc.on(
            "end",
            () => {
              resolve(
                Buffer.concat(
                  chunks
                )
              );
            }
          );

          doc.on(
            "error",
            reject
          );

          doc.font(
            DEVANAGARI_FONT_PATH
          );

          /* ==============================================
             HEADER
          ============================================== */

          doc
            .roundedRect(
              40,
              35,
              515,
              105,
              12
            )
            .lineWidth(1.5)
            .stroke();

          doc
            .fontSize(13)
            .text(
              "॥ श्री मोरया ॥",
              40,
              48,
              {
                align:
                  "center",

                width: 515,
              }
            );

          doc
            .fontSize(25)
            .text(
              "OM SAI CETERS",
              40,
              70,
              {
                align:
                  "center",

                width: 515,
              }
            );

          doc
            .fontSize(12)
            .text(
              "बिल / ऑर्डर पावती",
              40,
              110,
              {
                align:
                  "center",

                width: 515,
              }
            );

          /* ==============================================
             BILL DETAILS
          ============================================== */

          let currentY =
            160;

          doc
            .fontSize(11)
            .text(
              `बिल नंबर : ${
                booking.bookingNumber ||
                "-"
              }`,
              45,
              currentY
            );

          doc.text(
            `बुकिंग तारीख : ${formatBillDate(
              booking.bookingDate
            )}`,
            300,
            currentY
          );

          currentY += 23;

          doc.text(
            `कार्यक्रम तारीख : ${formatBillDate(
              booking.eventDate
            )}`,
            45,
            currentY
          );

          /* ==============================================
             CUSTOMER
          ============================================== */

          currentY += 35;

          doc
            .roundedRect(
              40,
              currentY,
              515,
              90,
              8
            )
            .lineWidth(0.8)
            .stroke();

          doc
            .fontSize(13)
            .text(
              "ग्राहकाची माहिती",
              55,
              currentY +
                12
            );

          doc
            .fontSize(11)
            .text(
              `नाव : ${
                booking.customer
                  ?.name ||
                "-"
              }`,
              55,
              currentY +
                38
            );

          doc.text(
            `मोबाईल : ${
              booking.customer
                ?.mobile ||
              "-"
            }`,
            300,
            currentY +
              38
          );

          doc.text(
            `पत्ता : ${
              booking.customer
                ?.address ||
              "-"
            }`,
            55,
            currentY +
              62,
            {
              width: 450,
            }
          );

          /* ==============================================
             MATERIAL TABLE
          ============================================== */

          currentY +=
            115;

          const tableX =
            40;

          const tableWidth =
            515;

          const headerHeight =
            30;

          doc
            .roundedRect(
              tableX,
              currentY,
              tableWidth,
              headerHeight,
              5
            )
            .lineWidth(
              0.8
            )
            .stroke();

          doc
            .fontSize(11)
            .text(
              "क्र.",
              50,
              currentY + 9
            );

          doc.text(
            "साहित्य",
            85,
            currentY + 9
          );

          doc.text(
            "नग",
            320,
            currentY + 9
          );

          doc.text(
            "दर",
            375,
            currentY + 9
          );

          doc.text(
            "रक्कम",
            450,
            currentY + 9
          );

          currentY +=
            headerHeight;

          const items =
            booking.items ||
            [];

          /* ==============================================
             ITEMS
          ============================================== */

          items.forEach(
            (
              item,
              index
            ) => {

              const materialName =
                item.material
                  ?.name ||
                "-";

              const quantity =
                Number(
                  item.quantity ||
                    0
                );

              const rate =
                Number(
                  item.rate ||
                    0
                );

              const amount =
                Number(
                  item.amount ??
                    quantity *
                      rate
                );

              const rowHeight =
                30;

              /* =========================================
                 NEW PAGE
              ========================================= */

              if (
                currentY >
                720
              ) {
                doc.addPage();

                doc.font(
                  DEVANAGARI_FONT_PATH
                );

                currentY = 50;
              }

              doc
                .moveTo(
                  tableX,
                  currentY
                )
                .lineTo(
                  tableX +
                    tableWidth,
                  currentY
                )
                .lineWidth(
                  0.5
                )
                .stroke();

              /* NUMBER */

              doc
                .fontSize(10)
                .text(
                  String(
                    index + 1
                  ),
                  50,
                  currentY +
                    9
                );

              /* MATERIAL */

              doc.text(
                materialName,
                85,
                currentY +
                  9,
                {
                  width: 220,

                  ellipsis:
                    true,
                }
              );

              /* QUANTITY */

              doc.text(
                String(
                  quantity
                ),
                320,
                currentY +
                  9
              );

              /* RATE */

              doc.text(
                `₹ ${rate.toFixed(
                  2
                )}`,
                365,
                currentY +
                  9,
                {
                  width: 65,

                  align:
                    "right",
                }
              );

              /* AMOUNT */

              doc.text(
                `₹ ${amount.toFixed(
                  2
                )}`,
                445,
                currentY +
                  9,
                {
                  width: 90,

                  align:
                    "right",
                }
              );

              currentY +=
                rowHeight;
            }
          );

          doc
            .moveTo(
              tableX,
              currentY
            )
            .lineTo(
              tableX +
                tableWidth,
              currentY
            )
            .lineWidth(
              0.8
            )
            .stroke();

          /* ==============================================
             TOTALS
          ============================================== */

          currentY +=
            25;

          if (
            currentY >
            620
          ) {
            doc.addPage();

            doc.font(
              DEVANAGARI_FONT_PATH
            );

            currentY = 60;
          }

          const totalAmount =
            Number(
              booking.totalAmount ||
                0
            );

          const advanceAmount =
            Number(
              booking.advanceAmount ||
                0
            );

          const remainingAmount =
            Number(
              booking.remainingAmount ||
                0
            );

          const totalBoxHeight =
            125;

          /* ==============================================
             TOTAL BOX
          ============================================== */

          doc
            .roundedRect(
              300,
              currentY,
              255,
              totalBoxHeight,
              8
            )
            .lineWidth(1)
            .stroke();

          doc
            .fontSize(11)
            .text(
              "एकूण रक्कम",
              315,
              currentY +
                15
            );

          doc.text(
            `₹ ${totalAmount.toFixed(
              2
            )}`,
            420,
            currentY +
              15,
            {
              width: 120,

              align:
                "right",
            }
          );

          doc.text(
            "जमा रक्कम",
            315,
            currentY +
              47
          );

          doc.text(
            `₹ ${advanceAmount.toFixed(
              2
            )}`,
            420,
            currentY +
              47,
            {
              width: 120,

              align:
                "right",
            }
          );

          doc.text(
            "बाकी रक्कम",
            315,
            currentY +
              79
          );

          doc.text(
            `₹ ${remainingAmount.toFixed(
              2
            )}`,
            420,
            currentY +
              79,
            {
              width: 120,

              align:
                "right",
            }
          );

          /* ==============================================
             PAYMENT STATUS
          ============================================== */

          let paymentText =
            "पैसे बाकी";

          if (
            booking.paymentStatus ===
            "PAID"
          ) {
            paymentText =
              "पूर्ण पैसे भरले";
          } else if (
            booking.paymentStatus ===
            "PARTIAL"
          ) {
            paymentText =
              "अंशतः पैसे भरले";
          }

          doc.text(
            `स्थिती : ${paymentText}`,
            315,
            currentY +
              107
          );

          /* ==============================================
             FOOTER
          ============================================== */

          doc
            .fontSize(14)
            .text(
              "आपल्या ऑर्डरसाठी धन्यवाद! 🙏",
              40,
              700,
              {
                align:
                  "center",

                width: 515,
              }
            );

          doc
            .fontSize(9)
            .text(
              "OM SAI CETERS • केटरिंग बुकिंग व ऑर्डर व्यवस्थापन",
              40,
              725,
              {
                align:
                  "center",

                width: 515,
              }
            );

          doc
            .fontSize(8)
            .text(
              `बिल नंबर : ${
                booking.bookingNumber ||
                "-"
              }`,
              40,
              745,
              {
                align:
                  "center",

                width: 515,
              }
            );

          doc.end();

        } catch (
          error
        ) {
          reject(
            error
          );
        }
      }
    );
  };

  /* =========================================================
   SEND BILL PDF ON WHATSAPP
   POST /api/bookings/:id/send-whatsapp
========================================================= */

export const sendBookingBillWhatsApp = async (
  req,
  res
) => {
  try {
    const bookingId = Number(
      req.params.id
    );

    if (
      !Number.isInteger(bookingId) ||
      bookingId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const accessToken =
      process.env.WHATSAPP_ACCESS_TOKEN;

    const apiVersion =
      process.env.WHATSAPP_API_VERSION ||
      "v23.0";

    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message:
          "WhatsApp API access token is missing.",
      });
    }

    /* =====================================================
       GET BOOKING
    ===================================================== */

    const booking =
      await prisma.booking.findUnique({
        where: {
          id: bookingId,
        },
        include:
          getBookingInclude,
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message:
          "Booking not found.",
      });
    }

    /* =====================================================
       WHATSAPP PHONE NUMBER ID
    ===================================================== */

    const phoneNumberId =
      booking.admin
        ?.whatsappPhoneNumberId ||
      process.env
        .WHATSAPP_PHONE_NUMBER_ID;

    if (!phoneNumberId) {
      return res.status(500).json({
        success: false,
        message:
          "Admin WhatsApp Phone Number ID is missing.",
      });
    }

    /* =====================================================
       CUSTOMER WHATSAPP NUMBER
    ===================================================== */

    const whatsappNumber =
      normalizeWhatsAppNumber(
        booking.customer?.mobile
      );

    if (!whatsappNumber) {
      return res.status(400).json({
        success: false,
        whatsappAvailable: false,
        message:
          "या मोबाईल नंबरवर WhatsApp उपलब्ध नाही.",
      });
    }

    /* =====================================================
       CREATE BILL PDF
    ===================================================== */

    const pdfBuffer =
      await createBillPDF(
        booking
      );

    /* =====================================================
       UPLOAD PDF TO WHATSAPP
    ===================================================== */

    const uploadUrl =
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/media`;

    const form =
      new FormData();

    form.append(
      "messaging_product",
      "whatsapp"
    );

    form.append(
      "file",
      pdfBuffer,
      {
        filename:
          `Bill-${booking.bookingNumber}.pdf`,
        contentType:
          "application/pdf",
      }
    );

    const uploadResponse =
      await axios.post(
        uploadUrl,
        form,
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
            ...form.getHeaders(),
          },

          maxContentLength:
            Infinity,

          maxBodyLength:
            Infinity,
        }
      );

    const mediaId =
      uploadResponse.data?.id;

    if (!mediaId) {
      throw new Error(
        "WhatsApp media upload failed."
      );
    }

    /* =====================================================
       SEND PDF MESSAGE
    ===================================================== */

    const messageUrl =
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    const messageResponse =
      await axios.post(
        messageUrl,
        {
          messaging_product:
            "whatsapp",

          recipient_type:
            "individual",

          to:
            whatsappNumber,

          type:
            "document",

          document: {
            id:
              mediaId,

            filename:
              `Bill-${booking.bookingNumber}.pdf`,

            caption:
              `ओम साई केटर्स - बिल ${booking.bookingNumber}`,
          },
        },
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,

            "Content-Type":
              "application/json",
          },
        }
      );

    /* =====================================================
       SUCCESS
    ===================================================== */

    return res.json({
      success: true,

      whatsappAvailable:
        true,

      message:
        "बिल PDF WhatsApp वर यशस्वीपणे पाठवण्यात आला.",

      bookingId,

      bookingNumber:
        booking.bookingNumber,

      adminId:
        booking.adminId ||
        null,

      whatsappMessageId:
        messageResponse.data
          ?.messages?.[0]
          ?.id ||
        null,
    });

  } catch (error) {
    console.error(
      "SEND WHATSAPP BILL ERROR:",
      error.response?.data ||
        error.message ||
        error
    );

    const metaError =
      error.response?.data?.error;

    if (metaError) {
      return res.status(502).json({
        success: false,

        message:
          metaError.message ||
          "WhatsApp bill send failed.",

        whatsappError:
          metaError,
      });
    }

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to send bill on WhatsApp.",
    });
  }
};
/* =========================================================
   GET BILL PDF FOR MOBILE SHARE
   GET /api/bookings/:id/bill-pdf
========================================================= */

export const getBookingBillPDF = async (
  req,
  res
) => {
  try {
    const bookingId = Number(
      req.params.id
    );

    if (
      !Number.isInteger(bookingId) ||
      bookingId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking =
      await prisma.booking.findUnique({
        where: {
          id: bookingId,
        },
        include: getBookingInclude,
      });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    /* =====================================================
       CREATE EXISTING BILL PDF
    ===================================================== */

    const pdfBuffer =
      await createBillPDF(
        booking
      );

    /* =====================================================
       SEND PDF TO FRONTEND
    ===================================================== */

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Bill-${booking.bookingNumber}.pdf"`
    );

    res.setHeader(
      "Content-Length",
      pdfBuffer.length
    );

    return res.send(
      pdfBuffer
    );

  } catch (error) {
    console.error(
      "GET BILL PDF ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Bill PDF तयार करताना error आला.",
    });
  }
};
  /* =========================================================
   HELPER:
   GET BOOKING WITH FULL DETAILS
========================================================= */

const getBookingForResponse =
  async (
    bookingId
  ) => {
    return prisma.booking.findUnique({
      where: {
        id:
          Number(
            bookingId
          ),
      },

      include:
        getBookingInclude,
    });
  };

/* =========================================================
   HELPER:
   SAFE NUMBER
========================================================= */

const safeNumber = (
  value
) => {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
};

/* =========================================================
   HELPER:
   PAYMENT SUMMARY
========================================================= */

const getPaymentSummary =
  (booking) => {
    const total =
      safeNumber(
        booking?.totalAmount
      );

    const advance =
      safeNumber(
        booking?.advanceAmount
      );

    const remaining =
      Math.max(
        total - advance,
        0
      );

    return {
      total,
      advance,
      remaining,

      status:
        calculatePaymentStatus(
          total,
          advance
        ),
    };
  };

/* =========================================================
   HELPER:
   MATERIAL SUMMARY
========================================================= */

const getMaterialSummary =
  (items = []) => {
    if (
      !Array.isArray(
        items
      )
    ) {
      return {
        totalQuantity: 0,
        totalAmount: 0,
        items: [],
      };
    }

    const normalized =
      items.map(
        (
          item
        ) => {
          const quantity =
            safeNumber(
              item.quantity
            );

          const rate =
            safeNumber(
              item.rate
            );

          const amount =
            safeNumber(
              item.amount
            ) ||
            quantity *
              rate;

          return {
            id:
              item.id,

            materialId:
              item.materialId,

            materialName:
              item.material?.name ||
              "-",

            quantity,

            rate,

            amount,

            returnedQuantity:
              safeNumber(
                item.returnedQuantity
              ),

            missingQuantity:
              safeNumber(
                item.missingQuantity
              ),
          };
        }
      );

    const totalQuantity =
      normalized.reduce(
        (
          sum,
          item
        ) =>
          sum +
          item.quantity,
        0
      );

    const totalAmount =
      normalized.reduce(
        (
          sum,
          item
        ) =>
          sum +
          item.amount,
        0
      );

    return {
      totalQuantity,

      totalAmount,

      items:
        normalized,
    };
  };

/* =========================================================
   GET BOOKING PAYMENT SUMMARY
========================================================= */

export const getBookingPaymentSummary =
  async (
    req,
    res
  ) => {
    try {
      const bookingId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          bookingId
        ) ||
        bookingId <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid booking ID.",
        });
      }

      const booking =
        await getBookingForResponse(
          bookingId
        );

      if (!booking) {
        return res.status(404).json({
          success: false,

          message:
            "Booking not found.",
        });
      }

      const payment =
        getPaymentSummary(
          booking
        );

      return res.json({
        success: true,

        bookingId,

        bookingNumber:
          booking.bookingNumber,

        payment,
      });
    } catch (
      error
    ) {
      console.error(
        "GET PAYMENT SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Failed to fetch payment summary.",
      });
    }
  };

/* =========================================================
   GET BOOKING MATERIAL SUMMARY
========================================================= */

export const getBookingMaterialSummary =
  async (
    req,
    res
  ) => {
    try {
      const bookingId =
        Number(
          req.params.id
        );

      if (
        !Number.isInteger(
          bookingId
        ) ||
        bookingId <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid booking ID.",
        });
      }

      const booking =
        await getBookingForResponse(
          bookingId
        );

      if (!booking) {
        return res.status(404).json({
          success: false,

          message:
            "Booking not found.",
        });
      }

      const materialSummary =
        getMaterialSummary(
          booking.items
        );

      return res.json({
        success: true,

        bookingId,

        bookingNumber:
          booking.bookingNumber,

        materials:
          materialSummary,
      });
    } catch (
      error
    ) {
      console.error(
        "GET MATERIAL SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Failed to fetch material summary.",
      });
    }
  };

/* =========================================================
   HEALTH CHECK FOR WHATSAPP CONFIG
========================================================= */

export const checkWhatsAppConfig =
  async (
    req,
    res
  ) => {
    try {
      const accessToken =
        process.env
          .WHATSAPP_ACCESS_TOKEN;

      const phoneNumberId =
        process.env
          .WHATSAPP_PHONE_NUMBER_ID;

      const apiVersion =
        process.env
          .WHATSAPP_API_VERSION ||
        "v23.0";

      return res.json({
        success: true,

        whatsapp: {
          accessTokenConfigured:
            Boolean(
              accessToken
            ),

          phoneNumberIdConfigured:
            Boolean(
              phoneNumberId
            ),

          apiVersion,
        },
      });
    } catch (
      error
    ) {
      console.error(
        "WHATSAPP CONFIG CHECK ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "WhatsApp configuration check failed.",
      });
    }
  };
  /* =========================================================
   END OF BOOKING CONTROLLER
========================================================= */
