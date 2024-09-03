// backend/server.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const resumeParser = require("./controllers/resumeParser");

const app = express();

// Set up storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Store files in 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename to prevent overwriting
  },
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Correct endpoint for uploading the resume
app.post("/api/upload", upload.single("resume"), resumeParser);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
