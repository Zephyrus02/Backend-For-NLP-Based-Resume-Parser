// server.js

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Import the file system module

// Initialize express app
const app = express();
app.use(cors());

// Function to log messages to a file
const logFilePath = path.join(__dirname, 'server.log'); // Path to log file
const logMessage = (message) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) console.error('Failed to write to log file:', err.message);
  });
};

// Set up storage with multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Endpoint to handle file upload
app.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    const errorMessage = 'Error: No file uploaded.';
    logMessage(errorMessage);
    return res.status(400).send('No file uploaded.');
  }

  const successMessage = `File uploaded successfully: ${req.file.filename}`;
  logMessage(successMessage);

  // Schedule file deletion after 10 minutes
  setTimeout(() => {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    fs.unlink(filePath, (err) => {
      if (err) {
        logMessage(`Error deleting file: ${err.message}`);
      } else {
        logMessage(`File deleted successfully: ${req.file.filename}`);
      }
    });
  }, 600000); // 600000 milliseconds = 10 minutes

  res.send({ message: 'File uploaded successfully', file: req.file });
});

// Error handling for multer
app.use((err, req, res, next) => {
  logMessage(`Error during file upload: ${err.message}`);
  res.status(500).send('An error occurred during file upload.');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  const startupMessage = `Server is running on port ${PORT}`;
  logMessage(startupMessage);
});
