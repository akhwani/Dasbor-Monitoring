import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("regulations.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS regulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    judul TEXT NOT NULL,
    pengusul TEXT NOT NULL,
    tahun INTEGER NOT NULL,
    status TEXT NOT NULL,
    dokumenUrl TEXT,
    tanggalPerubahan TEXT,
    keterangan TEXT,
    progress INTEGER DEFAULT 0
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Get all regulations
  app.get("/api/regulations", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM regulations ORDER BY tahun DESC, id DESC").all();
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch regulations" });
    }
  });

  // API: Sync with Google Sheets
  app.post("/api/sync", async (req, res) => {
    try {
      const sheetUrl = "https://docs.google.com/spreadsheets/d/1kASweZ7bavw2gxdIZsdNVPeDfYT9rVG9psIYn5Jw17w/export?format=csv&gid=0";
      const response = await axios.get(sheetUrl);
      const csvData = response.data;
      
      const lines = csvData.split("\n");
      
      // Clear existing data
      db.prepare("DELETE FROM regulations").run();
      
      const insert = db.prepare(`
        INSERT INTO regulations (tahun, judul, pengusul, status, progress, keterangan, tanggalPerubahan, dokumenUrl)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction((rows) => {
        for (const row of rows) {
          insert.run(row);
        }
      });

      const dataToInsert = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        // Handle CSV with potential commas inside quotes
        const cols = lines[i].match(/(".*?"|[^",\r\n]+)(?=\s*,|\s*$)|(?<=,|^)\s*,\s*(?=,|$)|(?<=,|^)\s*$/g) || [];
        const cleanCols = cols.map(c => c.trim().replace(/^"|"$/g, ''));

        if (cleanCols.length < 7) continue;

        // Structure: no,Regulasi,nomor peraturan,judul peraturan,Unit kerja,Tahun,status,tanggal perubahan status,progress,keterangan
        const judul = cleanCols[1] || "Untitled";
        const pengusul = cleanCols[4] || "Unknown";
        const tahun = parseInt(cleanCols[5]) || 2024;
        const status = (cleanCols[6] || "pengusulan").toLowerCase();
        const tanggalPerubahan = cleanCols[7] || "";
        
        // Progress is in decimal (0, 0.25, 0.5, 0.75, 1)
        let progress = parseFloat(cleanCols[8]) * 100 || 0;
        if (isNaN(progress)) progress = 0;

        const keterangan = cleanCols[9] || null;
        const dokumenUrl = "#";

        dataToInsert.push([tahun, judul, pengusul, status, Math.round(progress), keterangan, tanggalPerubahan, dokumenUrl]);
      }

      transaction(dataToInsert);
      const lastSynced = new Date().toISOString();
      res.json({ message: "Sync successful", count: dataToInsert.length, lastSynced });
    } catch (error) {
      console.error("Sync error:", error);
      res.status(500).json({ error: "Failed to sync with Google Sheets" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
