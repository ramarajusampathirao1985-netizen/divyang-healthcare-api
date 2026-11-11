const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
app.use(cors());
app.use(express.json({ limit: "1mb" }));

function getDatasetFiles() {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs.readdirSync(DATA_DIR)
    .filter(name => name.toLowerCase().endsWith(".csv"))
    .sort((a, b) => {
      if (a === "AP.csv") return -1;
      if (b === "AP.csv") return 1;
      return a.localeCompare(b);
    });
}

function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", row => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

async function readFacilities() {
  const files = getDatasetFiles();
  if (!files.length) throw new Error("No CSV datasets found in data directory");
  const allRows = [];
  for (const file of files) {
    const rows = await readCsv(path.join(DATA_DIR, file));
    for (const row of rows) {
      allRows.push({ id: String(allRows.length + 1), ...row });
    }
  }
  return allRows;
}

const includes = (value, query) =>
  String(value ?? "").toLowerCase().includes(String(query).toLowerCase());

app.get("/", (_req, res) => res.json({
  name: "Divyang Disang Healthcare API",
  status: "running",
  endpoints: ["/api/health", "/api/datasets", "/api/facilities", "/api/facilities/:id", "/api/filters"]
}));

app.get("/api/health", (_req, res) => {
  const files = getDatasetFiles();
  res.status(files.length ? 200 : 503).json({
    success: files.length > 0,
    service: "Divyang Disang Healthcare API",
    datasetAvailable: files.length > 0,
    datasets: files.length
  });
});

app.get("/api/datasets", (_req, res) => {
  const files = getDatasetFiles();
  res.json({
    success: true,
    count: files.length,
    datasets: files.map(file => file.replace(/\.csv$/i, ""))
  });
});

app.get("/api/facilities", async (req, res) => {
  try {
    let rows = await readFacilities();
    for (const field of ["state", "city", "category", "subcategory", "approvalStatus", "isActive"]) {
      if (req.query[field] !== undefined) {
        rows = rows.filter(row => includes(row[field], req.query[field]));
      }
    }
    if (req.query.search) {
      rows = rows.filter(row =>
        ["name", "category", "subcategory", "state", "city", "address", "description"]
          .some(key => includes(row[key], req.query.search))
      );
    }
    const total = rows.length;
    const page = Math.max(parseInt(req.query.page || "1", 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10) || 20, 1), 100);
    res.json({
      success: true, total, page, limit,
      totalPages: Math.ceil(total / limit),
      data: rows.slice((page - 1) * limit, page * limit)
    });
  } catch (error) {
    res.status(503).json({ success: false, message: error.message });
  }
});

app.get("/api/facilities/:id", async (req, res) => {
  try {
    const rows = await readFacilities();
    const item = rows.find(row => row.id === req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Facility not found" });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(503).json({ success: false, message: error.message });
  }
});

app.get("/api/filters", async (_req, res) => {
  try {
    const rows = await readFacilities();
    const unique = key => [...new Set(rows.map(row => row[key]).filter(Boolean))].sort();
    res.json({
      success: true,
      states: unique("state"),
      cities: unique("city"),
      categories: unique("category"),
      subcategories: unique("subcategory")
    });
  } catch (error) {
    res.status(503).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => console.log(`Divyang Healthcare API listening on port ${PORT}`));
