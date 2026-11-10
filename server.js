const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const CSV_FILE = path.join(__dirname, "data", "AP.csv");
app.use(cors());
app.use(express.json({ limit: "1mb" }));

function readFacilities() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CSV_FILE)) return reject(new Error("Dataset missing: upload data/AP.csv"));
    const rows = [];
    fs.createReadStream(CSV_FILE).pipe(csv())
      .on("data", row => rows.push(row))
      .on("end", () => resolve(rows.map((row, i) => ({ id: String(i + 1), ...row }))))
      .on("error", reject);
  });
}
const includes = (value, query) => String(value ?? "").toLowerCase().includes(String(query).toLowerCase());

app.get("/", (_req, res) => res.json({
  name: "Divyang Disang Healthcare API", status: "running",
  endpoints: ["/api/health", "/api/facilities", "/api/facilities/:id", "/api/filters"]
}));
app.get("/api/health", (_req, res) => {
  const ok = fs.existsSync(CSV_FILE);
  res.status(ok ? 200 : 503).json({ success: ok, service: "Divyang Disang Healthcare API", datasetAvailable: ok });
});
app.get("/api/facilities", async (req, res) => {
  try {
    let rows = await readFacilities();
    for (const field of ["state","city","category","subcategory","approvalStatus","isActive"]) {
      if (req.query[field] !== undefined) rows = rows.filter(row => includes(row[field], req.query[field]));
    }
    if (req.query.search) rows = rows.filter(row =>
      ["name","category","subcategory","state","city","address","description"].some(k => includes(row[k], req.query.search))
    );
    const total = rows.length;
    const page = Math.max(parseInt(req.query.page || "1", 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10) || 20, 1), 100);
    res.json({ success:true, total, page, limit, totalPages:Math.ceil(total/limit), data:rows.slice((page-1)*limit,page*limit) });
  } catch (e) { res.status(503).json({ success:false, message:e.message }); }
});
app.get("/api/facilities/:id", async (req, res) => {
  try {
    const rows = await readFacilities();
    const item = rows.find(row => row.id === req.params.id);
    if (!item) return res.status(404).json({ success:false, message:"Facility not found" });
    res.json({ success:true, data:item });
  } catch (e) { res.status(503).json({ success:false, message:e.message }); }
});
app.get("/api/filters", async (_req, res) => {
  try {
    const rows = await readFacilities();
    const unique = key => [...new Set(rows.map(row => row[key]).filter(Boolean))].sort();
    res.json({ success:true, states:unique("state"), cities:unique("city"), categories:unique("category"), subcategories:unique("subcategory") });
  } catch (e) { res.status(503).json({ success:false, message:e.message }); }
});
app.listen(PORT, () => console.log(`Divyang Healthcare API listening on port ${PORT}`));