import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Allow access to env vars prefixed with VITE_
  },
  server: {
    port: 5173,
  },
});
