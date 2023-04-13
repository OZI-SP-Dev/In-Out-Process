/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import dns from "dns";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

dns.setDefaultResultOrder("verbatim");

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  base: "",
  server: {
    host: "localhost",
    port: 3000,
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["**/__tests__/*.*"],
    setupFiles: "./src/setupTests.ts",
  },
});
