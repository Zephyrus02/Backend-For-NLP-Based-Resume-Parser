const express = require("express");
const multer = require("multer");
const path = require("path");
const resumeParser = require("./controllers/resumeParser");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint for uploading the resume
app.post("/api/upload", upload.single("resume"), resumeParser);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
