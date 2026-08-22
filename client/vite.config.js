import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    /* =====================================================
       TAILWIND CSS
    ===================================================== */

    tailwindcss(),

    /* =====================================================
       PWA
    ===================================================== */

    VitePWA({
      registerType: "autoUpdate",

      manifest: {
        name: "OM SAI CETERS",

        short_name: "OM SAI CETERS",

        description:
          "OM SAI CETERS Catering Booking & Billing App",

        theme_color: "#0f172a",

        background_color: "#f6f7fb",

        display: "standalone",

        start_url: "/",

        scope: "/",

        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },

          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },

          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],

  /* =====================================================
     VITE SERVER
  ===================================================== */

  server: {
    host: true,
  },

  /* =====================================================
     PREVIEW SERVER
  ===================================================== */

  preview: {
    host: true,
  },
});