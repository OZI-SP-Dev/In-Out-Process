// scripts/merge-files.js
// This script uses NodeJS to perform the concatenation and file removal, rather than using OS dependant shell scripts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dist = path.join(__dirname, "..", "dist");

fs.appendFileSync(
  path.join(dist, "index.aspx"),
  fs.readFileSync(path.join(dist, "index.html")),
);

fs.unlinkSync(path.join(dist, "index.html"));
fs.unlinkSync(path.join(dist, "mockServiceWorker.js"));
