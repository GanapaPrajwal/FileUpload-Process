require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { addJobToQueue } = require("./queue");
const { db } = require("./database");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// Upload CSV & Process Images
app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const requestId = Date.now().toString();
    const filePath = req.file.path;

    const sql = "INSERT INTO requests (request_id, status, input_csv) VALUES (?, ?, ?)";
    db.query(sql, [requestId, "Processing", filePath]);

    addJobToQueue(requestId, filePath);
    res.json({ request_id: requestId });
});

// Check Processing Status
app.get("/status/:requestId", (req, res) => {
    const requestId = req.params.requestId;
    db.query("SELECT * FROM requests WHERE request_id = ?", [requestId], (err, rows) => {
        if (rows.length > 0) res.json(rows[0]);
        else res.status(404).json({ error: "Request ID not found" });
    });
});

// Serve processed CSV files
app.get("/download/:requestId", (req, res) => {
    const requestId = req.params.requestId;
    db.query("SELECT output_csv FROM requests WHERE request_id = ?", [requestId], (err, rows) => {
        if (rows.length > 0 && rows[0].output_csv) res.download(rows[0].output_csv);
        else res.status(404).json({ error: "Processed file not available" });
    });
});

app.listen(3000, () => console.log("Server running on port 3000"));
