import PDFDocument from "pdfkit";
import prisma from "../config/prisma.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

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
   COLORS
========================================================= */

const COLORS = {
  dark: "#111827",
  slate: "#475569",
  muted: "#64748B",
  light: "#F8FAFC",
  border: "#E2E8F0",
  orange: "#F97316",
  orangeLight: "#FFF7ED",
  green: "#16A34A",
  greenLight: "#F0FDF4",
  red: "#DC2626",
  redLight: "#FEF2F2",
  white: "#FFFFFF",
};

/* =========================================================
   GENERATE BOOKING BILL PDF

   GET /api/bookings/:id/bill

   IMPORTANT:
   या PDF मध्ये ADMIN चे नाव किंवा tracking माहिती
   जाणूनबुजून घेतलेली नाही.
========================================================= */

export const generateBookingBill =
  async (req, res) => {
    try {
      /* ===================================================
         BOOKING ID
      =================================================== */

      const bookingId =
        Number(req.params.id);

      if (
        !Number.isInteger(
          bookingId
        ) ||
        bookingId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "बुकिंग क्रमांक योग्य नाही.",
        });
      }

      /* ===================================================
         GET BOOKING

         फक्त:
         customer
         items
         material

         ADMIN relation इथे घेतलेली नाही.
      =================================================== */

      const booking =
        await prisma.booking.findUnique({
          where: {
            id: bookingId,
          },

          include: {
            customer: true,

            items: {
              include: {
                material: true,
              },

              orderBy: {
                id: "asc",
              },
            },
          },
        });

      /* ===================================================
         BOOKING NOT FOUND
      =================================================== */

      if (!booking) {
        return res.status(404).json({
          success: false,
          message:
            "बुकिंग सापडली नाही.",
        });
      }

      /* ===================================================
         FONT CHECK
      =================================================== */

      if (
        !fs.existsSync(
          DEVANAGARI_FONT_PATH
        )
      ) {
        return res.status(500).json({
          success: false,
          message:
            "Devanagari font सापडला नाही.",
        });
      }

      /* ===================================================
         RESPONSE
      =================================================== */

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="Bill-${booking.bookingNumber}.pdf"`
      );

      /* ===================================================
         PDF
      =================================================== */

      const doc =
        new PDFDocument({
          size: "A4",
          margin: 0,
          bufferPages: true,

          info: {
            Title: `Bill ${booking.bookingNumber}`,

            Author:
              "OM SAI CETERS",

            Subject:
              "ग्राहक बिल",
          },
        });

      doc.pipe(res);

      /*
        Devanagari font कायम वापरायचा.
      */

      doc.font(
        DEVANAGARI_FONT_PATH
      );

      const PAGE_WIDTH =
        595.28;

      const PAGE_HEIGHT =
        841.89;

      const LEFT = 40;

      const RIGHT = 555;

      const CONTENT_WIDTH =
        RIGHT - LEFT;

      let currentY = 35;

      /* ===================================================
         HELPERS
      =================================================== */

      const money = (
        value
      ) => {
        return `₹ ${Number(
          value || 0
        ).toLocaleString(
          "en-IN"
        )}`;
      };

      const safeText = (
        value
      ) => {
        if (
          value === null ||
          value === undefined ||
          value === ""
        ) {
          return "-";
        }

        return String(value);
      };

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

      const paymentLabel =
        () => {
          if (
            booking.paymentStatus ===
            "PAID"
          ) {
            return "पूर्ण भरले";
          }

          if (
            booking.paymentStatus ===
            "PARTIAL"
          ) {
            return "अंशतः भरले";
          }

          return "पैसे बाकी";
        };

      const roundedBox = (
        x,
        y,
        width,
        height,
        radius = 10,
        fill = null,
        stroke =
          COLORS.border
      ) => {
        if (fill) {
          doc
            .fillColor(fill)
            .roundedRect(
              x,
              y,
              width,
              height,
              radius
            )
            .fill();
        }

        doc
          .strokeColor(stroke)
          .lineWidth(0.8)
          .roundedRect(
            x,
            y,
            width,
            height,
            radius
          )
          .stroke();
      };

      const sectionTitle = (
        title,
        subtitle,
        y
      ) => {
        doc
          .fillColor(
            COLORS.dark
          )
          .fontSize(14)
          .text(
            title,
            LEFT,
            y,
            {
              width:
                CONTENT_WIDTH,
            }
          );

        if (subtitle) {
          doc
            .fillColor(
              COLORS.muted
            )
            .fontSize(8.5)
            .text(
              subtitle,
              LEFT,
              y + 20,
              {
                width:
                  CONTENT_WIDTH,
              }
            );
        }

        doc
          .strokeColor(
            COLORS.orange
          )
          .lineWidth(2)
          .moveTo(
            LEFT,
            y + 35
          )
          .lineTo(
            LEFT + 85,
            y + 35
          )
          .stroke();
      };

      /* ===================================================
         PAGE BACKGROUND
      =================================================== */

      doc
        .rect(
          0,
          0,
          PAGE_WIDTH,
          PAGE_HEIGHT
        )
        .fill(
          COLORS.white
        );

      /* ===================================================
         TOP ORANGE LINE
      =================================================== */

      doc
        .rect(
          0,
          0,
          PAGE_WIDTH,
          7
        )
        .fill(
          COLORS.orange
        );

      /* ===================================================
         HEADER
      =================================================== */

      roundedBox(
        LEFT,
        currentY,
        CONTENT_WIDTH,
        118,
        14,
        COLORS.orangeLight,
        "#FED7AA"
      );

      doc
        .fillColor(
          COLORS.orange
        )
        .fontSize(12)
        .text(
          "॥ श्री मोरया ॥",
          LEFT,
          currentY + 14,
          {
            width:
              CONTENT_WIDTH,
            align: "center",
          }
        );

      doc
        .fillColor(
          COLORS.dark
        )
        .fontSize(26)
        .text(
          "OM SAI CETERS",
          LEFT,
          currentY + 38,
          {
            width:
              CONTENT_WIDTH,
            align: "center",
          }
        );

      doc
        .fillColor(
          COLORS.slate
        )
        .fontSize(12)
        .text(
          "बिल / ऑर्डर",
          LEFT,
          currentY + 77,
          {
            width:
              CONTENT_WIDTH,
            align: "center",
          }
        );

      doc
        .fillColor(
          COLORS.muted
        )
        .fontSize(8.5)
        .text(
          "केटरिंग बुकिंग व ऑर्डर पावती",
          LEFT,
          currentY + 96,
          {
            width:
              CONTENT_WIDTH,
            align: "center",
          }
        );

      currentY += 142;

      /* ===================================================
         BILL INFO
      =================================================== */

      roundedBox(
        LEFT,
        currentY,
        CONTENT_WIDTH,
        78,
        12,
        COLORS.light
      );

      const infoWidth =
        CONTENT_WIDTH / 3;

      const infoY =
        currentY + 15;

      /* BILL NUMBER */

      doc
        .fillColor(
          COLORS.muted
        )
        .fontSize(8)
        .text(
          "बिल नंबर",
          LEFT + 15,
          infoY
        );

      doc
        .fillColor(
          COLORS.dark
        )
        .fontSize(11)
        .text(
          safeText(
            booking.bookingNumber
          ),
          LEFT + 15,
          infoY + 19
        );

      /* BOOKING DATE */

      doc
        .fillColor(
          COLORS.muted
        )
        .fontSize(8)
        .text(
          "बुकिंग तारीख",
          LEFT +
            infoWidth +
            10,
          infoY
        );

      doc
        .fillColor(
          COLORS.dark
        )
        .fontSize(10)
        .text(
          formatDate(
            booking.bookingDate
          ),
          LEFT +
            infoWidth +
            10,
          infoY + 19
        );

      /* EVENT DATE */

      doc
        .fillColor(
          COLORS.muted
        )
        .fontSize(8)
        .text(
          "कार्यक्रम तारीख",
          LEFT +
            infoWidth * 2 +
            5,
          infoY
        );

      doc
        .fillColor(
          COLORS.dark
        )
        .fontSize(10)
        .text(
          formatDate(
            booking.eventDate
          ),
          LEFT +
            infoWidth * 2 +
            5,
          infoY + 19
        );

      currentY += 100;

      /* ===================================================
         CUSTOMER
      =================================================== */

      sectionTitle(
        "ग्राहकाची माहिती",
        null,
        currentY
      );

      currentY += 48;

      roundedBox(
        LEFT,
        currentY,
        CONTENT_WIDTH,
        88,
        12,
        COLORS.white
      );

      const customerColumn =
        CONTENT_WIDTH / 2;

      /* NAME */

      doc
        .fillColor(
          COLORS.muted
        )
        .fontSize(8)
        .text(
          "ग्राहकाचे नाव",
          LEFT + 15,
          currentY + 14
        );

      doc
        .fillColor(
          COLORS.dark
        )
        .fontSize(11)
        .text(
          safeText(
            booking.customer
              ?.name
          ),
          LEFT + 15,
          currentY + 32,
          {
            width:
              customerColumn -
              30,
          }
        );

      /* MOBILE */

      doc
        .fillColor(
          COLORS.muted
        )
        .fontSize(8)
        .text(
          "मोबाईल नंबर",
          LEFT +
            customerColumn +
            10,
          currentY + 14
        );

      doc
        .fillColor(
          COLORS.dark
        )
        .fontSize(11)
        .text(
          safeText(
            booking.customer
              ?.mobile
          ),
          LEFT +
            customerColumn +
            10,
          currentY + 32,
          {
            width:
              customerColumn -
              25,
          }
        );

      /* ADDRESS */

      doc
        .fillColor(
          COLORS.muted
        )
        .fontSize(8)
        .text(
          "पत्ता",
          LEFT + 15,
          currentY + 58
        );

      doc
        .fillColor(
          COLORS.slate
        )
        .fontSize(9)
        .text(
          safeText(
            booking.customer
              ?.address
          ),
          LEFT + 55,
          currentY + 56,
          {
            width:
              CONTENT_WIDTH -
              75,
          }
        );

      currentY += 116;

      /* ===================================================
         MATERIAL TITLE
      =================================================== */

      sectionTitle(
        "साहित्याचा तपशील",
        null,
        currentY
      );

      currentY += 48;

      /* ===================================================
         TABLE
      =================================================== */

      const tableX =
        LEFT;

      const tableWidth =
        CONTENT_WIDTH;

      const col1 = 35;
      const col2 = 250;
      const col3 = 70;
      const col4 = 80;
      const col5 = 80;

      /* ===================================================
         TABLE HEADER
      =================================================== */

      doc
        .fillColor(
          COLORS.dark
        )
        .roundedRect(
          tableX,
          currentY,
          tableWidth,
          34,
          8
        )
        .fill();

      doc
        .fillColor(
          COLORS.white
        )
        .fontSize(9)
        .text(
          "क्र.",
          tableX + 10,
          currentY + 11,
          {
            width: col1,
          }
        );

      doc.text(
        "साहित्य",
        tableX + col1,
        currentY + 11,
        {
          width: col2,
        }
      );

      doc.text(
        "नग",
        tableX +
          col1 +
          col2,
        currentY + 11,
        {
          width: col3,
          align: "center",
        }
      );

      doc.text(
        "दर",
        tableX +
          col1 +
          col2 +
          col3,
        currentY + 11,
        {
          width: col4,
          align: "center",
        }
      );

      doc.text(
        "रक्कम",
        tableX +
          col1 +
          col2 +
          col3 +
          col4,
        currentY + 11,
        {
          width:
            col5 - 10,
          align: "right",
        }
      );

      currentY += 34;

      /* ===================================================
         ITEMS
      =================================================== */

      const items =
        booking.items || [];

      items.forEach(
        (item, index) => {
          const rowHeight = 34;

          /* ================================================
             NEW PAGE
          ================================================= */

          if (
            currentY +
              rowHeight >
            690
          ) {
            doc.addPage();

            doc
              .rect(
                0,
                0,
                PAGE_WIDTH,
                PAGE_HEIGHT
              )
              .fill(
                COLORS.white
              );

            doc
              .rect(
                0,
                0,
                PAGE_WIDTH,
                7
              )
              .fill(
                COLORS.orange
              );

            doc.font(
              DEVANAGARI_FONT_PATH
            );

            currentY = 35;

            sectionTitle(
              "साहित्याचा तपशील",
              null,
              currentY
            );

            currentY += 48;

            doc
              .fillColor(
                COLORS.dark
              )
              .roundedRect(
                tableX,
                currentY,
                tableWidth,
                34,
                8
              )
              .fill();

            doc
              .fillColor(
                COLORS.white
              )
              .fontSize(9)
              .text(
                "क्र.",
                tableX + 10,
                currentY + 11
              );

            doc.text(
              "साहित्य",
              tableX + col1,
              currentY + 11
            );

            doc.text(
              "नग",
              tableX +
                col1 +
                col2,
              currentY + 11,
              {
                width: col3,
                align:
                  "center",
              }
            );

            doc.text(
              "दर",
              tableX +
                col1 +
                col2 +
                col3,
              currentY + 11,
              {
                width: col4,
                align:
                  "center",
              }
            );

            doc.text(
              "रक्कम",
              tableX +
                col1 +
                col2 +
                col3 +
                col4,
              currentY + 11,
              {
                width:
                  col5 - 10,
                align:
                  "right",
              }
            );

            currentY += 34;
          }

          /* ================================================
             VALUES
          ================================================= */

          const materialName =
            safeText(
              item.material
                ?.name
            );

          const quantity =
            Number(
              item.quantity || 0
            );

          const rate =
            Number(
              item.rate || 0
            );

          const amount =
            Number(
              item.amount ??
                quantity * rate
            );

          const rowFill =
            index % 2 === 0
              ? "#FFFFFF"
              : "#F8FAFC";

          /* ================================================
             ROW
          ================================================= */

          doc
            .fillColor(rowFill)
            .rect(
              tableX,
              currentY,
              tableWidth,
              rowHeight
            )
            .fill();

          doc
            .strokeColor(
              COLORS.border
            )
            .lineWidth(0.4)
            .moveTo(
              tableX,
              currentY +
                rowHeight
            )
            .lineTo(
              tableX +
                tableWidth,
              currentY +
                rowHeight
            )
            .stroke();

          /* NUMBER */

          doc
            .fillColor(
              COLORS.muted
            )
            .fontSize(8.5)
            .text(
              String(
                index + 1
              ),
              tableX + 10,
              currentY + 11
            );

          /* MATERIAL */

          doc
            .fillColor(
              COLORS.dark
            )
            .fontSize(9)
            .text(
              materialName,
              tableX + col1,
              currentY + 9,
              {
                width:
                  col2 - 8,
                ellipsis: true,
              }
            );

          /* QTY */

          doc.text(
            String(
              quantity
            ),
            tableX +
              col1 +
              col2,
            currentY + 9,
            {
              width: col3,
              align:
                "center",
            }
          );

          /* RATE */

          doc.text(
            money(rate),
            tableX +
              col1 +
              col2 +
              col3,
            currentY + 9,
            {
              width: col4,
              align:
                "center",
            }
          );

          /* AMOUNT */

          doc.text(
            money(amount),
            tableX +
              col1 +
              col2 +
              col3 +
              col4,
            currentY + 9,
            {
              width:
                col5 - 10,
              align:
                "right",
            }
          );

          currentY +=
            rowHeight;
        }
      );

      /* ===================================================
         TOTAL QUANTITY
      =================================================== */

      currentY += 10;

      const totalQuantity =
        Number(
          booking.totalQuantity ||
            0
        );

      roundedBox(
        LEFT,
        currentY,
        180,
        52,
        10,
        COLORS.light
      );

      doc
        .fillColor(
          COLORS.muted
        )
        .fontSize(8)
        .text(
          "एकूण साहित्य",
          LEFT + 12,
          currentY + 11
        );

      doc
        .fillColor(
          COLORS.dark
        )
        .fontSize(13)
        .text(
          `${totalQuantity} नग`,
          LEFT + 12,
          currentY + 27
        );

      /* ===================================================
         PAYMENT SUMMARY
      =================================================== */

      const paymentBoxX =
        300;

      const paymentBoxWidth =
        255;

      const paymentBoxHeight =
        150;

      roundedBox(
        paymentBoxX,
        currentY,
        paymentBoxWidth,
        paymentBoxHeight,
        12,
        COLORS.light
      );

      doc
        .fillColor(
          COLORS.dark
        )
        .fontSize(12)
        .text(
          "पेमेंट माहिती",
          paymentBoxX + 15,
          currentY + 14
        );

      /* TOTAL */

      doc
        .fillColor(
          COLORS.muted
        )
        .fontSize(9)
        .text(
          "एकूण बिल",
          paymentBoxX + 15,
          currentY + 43
        );

      doc
        .fillColor(
          COLORS.dark
        )
        .fontSize(12)
        .text(
          money(
            booking.totalAmount
          ),
          paymentBoxX + 115,
          currentY + 40,
          {
            width: 120,
            align:
              "right",
          }
        );

      /* ADVANCE */

      doc
        .fillColor(
          COLORS.muted
        )
        .fontSize(9)
        .text(
          "जमा रक्कम",
          paymentBoxX + 15,
          currentY + 70
        );

      doc
        .fillColor(
          COLORS.green
        )
        .fontSize(11)
        .text(
          money(
            booking.advanceAmount
          ),
          paymentBoxX + 115,
          currentY + 67,
          {
            width: 120,
            align:
              "right",
          }
        );

      /* REMAINING */

      doc
        .fillColor(
          COLORS.muted
        )
        .fontSize(9)
        .text(
          "बाकी रक्कम",
          paymentBoxX + 15,
          currentY + 97
        );

      doc
        .fillColor(
          COLORS.red
        )
        .fontSize(12)
        .text(
          money(
            booking.remainingAmount
          ),
          paymentBoxX + 115,
          currentY + 94,
          {
            width: 120,
            align:
              "right",
          }
        );

      /* PAYMENT STATUS */

      const status =
        paymentLabel();

      const statusColor =
        booking.paymentStatus ===
        "PAID"
          ? COLORS.green
          : booking.paymentStatus ===
            "PARTIAL"
          ? COLORS.orange
          : COLORS.red;

      doc
        .fillColor(
          statusColor
        )
        .fontSize(8.5)
        .text(
          `स्थिती: ${status}`,
          paymentBoxX + 15,
          currentY + 125
        );

      /* ===================================================
         FOOTER
      =================================================== */

      const footerY =
        Math.max(
          currentY +
            paymentBoxHeight +
            30,
          650
        );

      doc
        .strokeColor(
          COLORS.border
        )
        .lineWidth(0.8)
        .moveTo(
          LEFT,
          footerY
        )
        .lineTo(
          RIGHT,
          footerY
        )
        .stroke();

      doc
        .fillColor(
          COLORS.dark
        )
        .fontSize(13)
        .text(
          "आपल्या ऑर्डरसाठी धन्यवाद! 🙏",
          LEFT,
          footerY + 18,
          {
            width:
              CONTENT_WIDTH,
            align:
              "center",
          }
        );

      doc
        .fillColor(
          COLORS.muted
        )
        .fontSize(8.5)
        .text(
          "OM SAI CETERS • केटरिंग बुकिंग व ऑर्डर व्यवस्थापन",
          LEFT,
          footerY + 41,
          {
            width:
              CONTENT_WIDTH,
            align:
              "center",
          }
        );

      doc
        .fillColor(
          COLORS.muted
        )
        .fontSize(7.5)
        .text(
          `बिल नंबर: ${safeText(
            booking.bookingNumber
          )}`,
          LEFT,
          footerY + 58,
          {
            width:
              CONTENT_WIDTH,
            align:
              "center",
          }
        );

      /* ===================================================
         END PDF
      =================================================== */

      doc.end();
    } catch (error) {
      console.error(
        "GENERATE BILL ERROR:",
        error
      );

      if (
        !res.headersSent
      ) {
        return res
          .status(500)
          .json({
            success: false,
            message:
              error.message ||
              "बिल तयार करताना त्रुटी आली.",
          });
      }
    }
  };