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
    include: ["**/__tests__/*.tsx"],
    setupFiles: "src/setupTests.ts",
    /* -- START Temporary fix to allow testing to still work. TODO - look into */
    deps: {
      inline: ["@fluentui/merge-styles"],
    },
    /* -- END Temporary fix to allow testing to still work. TODO - look into */
  },
  define:
    process.env.NODE_ENV !== "production"
      ? {
          // Only define _spPageContextInfo if we are in NodeJS Dev
          //  -- so that it uses SharePoint otherwise
          _spPageContextInfo: JSON.stringify({
            siteId: "{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}",
            userEmail: "Barb Akew@localhost",
            aadUserId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            webAbsoluteUrl: "http://localhost:3000",
          }),
        }
      : {}, // Empty define for production so we use the server defined _spPageContextInfo
});
