const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const upload = multer({ dest: 'uploads/' });
require("dotenv").config();

// Initialize express app
const app = express();
app.use(cors());

// Function to log messages to a file
const logFilePath = path.join(__dirname, "server.log"); // Path to log file
const logMessage = (message) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFile(logFilePath, logEntry, (err) => {
        if (err) console.error("Failed to write to log file:", err.message);
    });
};

const deleteExistingFiles = () => {
    const directory = 'uploads/';
    fs.readdir(directory, (err, files) => {
        if (err) throw err;
        for (const file of files) {
            fs.unlink(path.join(directory, file), (err) => {
                if (err) throw err;
                fs.appendFileSync('server.log', `Deleted file: ${file}\n`);
            });
        }
    });
};

// Delete files on server start
deleteExistingFiles();

// Function to fetch job data from LinkedIn API
const fetchJobData = async () => {
    const LinkedIn_API_Key = process.env.LinkedIn_API_Key;
    const apiEndpoint = process.env.LinkedIn_API_Endpoint;

    const params = {
        job_type: "anything",
        experience_level: "anything",
        when: "past-week",
        keyword: "fullstack developer",
        limit: 6
    };

    try {
        const response = await axios.get(apiEndpoint, {
            headers: {
                Authorization: `Bearer ${LinkedIn_API_Key}`,
                "Content-Type": "application/json",
            },
            params: params,
        });

        console.log("Job data fetched successfully");
        return response.data.job; // Assuming response contains jobs array
    } catch (error) {
        console.log(`Error fetching data: ${error.message}`);
        throw error;
    }
};

// Endpoint to handle file upload
app.post("/upload", upload.single("pdf"), async (req, res) => {
    if (!req.file) {
        const errorMessage = "Error: No file uploaded.";
        logMessage(errorMessage);
        return res.status(400).send("No file uploaded.");
    }

    const successMessage = `File uploaded successfully: ${req.file.filename}`;
    logMessage(successMessage);

    // Schedule file deletion after 3 minutes
    setTimeout(() => {
        const filePath = path.join(__dirname, "uploads", req.file.filename);

        fs.unlink(filePath, (err) => {
            if (err) {
                logMessage(`Error deleting file: ${err.message}`);
            } else {
                logMessage(`File deleted successfully: ${req.file.filename}`);
            }
        });
    }, 180000); // 180000 milliseconds = 3 minutes

    // Fetch job data after successful upload
    try {
        const jobData = await fetchJobData();
        res.send({ message: "File uploaded successfully", file: req.file, jobs: jobData });
    } catch (error) {
        console.log(`Error fetching job data after upload: ${error.message}`);
        res.status(500).send("File uploaded but failed to fetch job data.");
    }
});

// Error handling for multer
app.use((err, req, res, next) => {
    logMessage(`Error during file upload: ${err.message}`);
    res.status(500).send("An error occurred during file upload.");
});

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => {
    const startupMessage = `Server is running on port ${PORT}`;
    logMessage(startupMessage);
    console.log(startupMessage);
});
