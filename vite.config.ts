import { defineConfig } from "vite";
import dns from "dns";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

dns.setDefaultResultOrder("verbatim");

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  base: "",
  server: {
    host: "localhost",
    port: 3000,
  },
});
