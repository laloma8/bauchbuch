import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const SLATE = "#49516f";

export default defineConfig({
  root: "src/ui",
  // Relative paths: the same build works under /bauchbuch/ on GitHub Pages and at / on the laptop.
  base: "./",
  define: {
    // Shown as "Version …" at the bottom, so you can tell when an update has arrived.
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
  },
  // Reachable from the phone in the home Wi-Fi.
  preview: {
    host: true,
    port: 3000,
  },
  plugins: [
    VitePWA({
      // A plain registration script: a new version is fetched in the background and shows up
      // the next time the app is opened. The page never reloads by itself while you're typing.
      registerType: "autoUpdate",
      injectRegister: "script",
      workbox: {
        globPatterns: ["**/*.{html,js,css,png,svg,webmanifest}"],
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: "Gesundheitstracker",
        short_name: "Bauchbuch",
        lang: "de",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: SLATE,
        theme_color: SLATE,
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
