const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs"); // Import the file system module
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

// Function to delete all files in the uploads directory
const deleteAllFilesInUploads = () => {
	const uploadDir = path.join(__dirname, "uploads");

	// Check if the directory exists
	if (fs.existsSync(uploadDir)) {
		fs.readdir(uploadDir, (err, files) => {
			if (err) {
				logMessage(`Error reading files in upload directory: ${err.message}`);
				return;
			}

			// Iterate through all files in the directory
			files.forEach((file) => {
				const filePath = path.join(uploadDir, file);
				fs.unlink(filePath, (err) => {
					if (err) {
						logMessage(`Error deleting file ${file}: ${err.message}`);
					} else {
						logMessage(`File deleted on startup: ${file}`);
					}
				});
			});
		});
	} else {
		// Create the directory if it doesn't exist
		fs.mkdirSync(uploadDir);
		logMessage(`Uploads directory created.`);
	}
};

// Delete all files in the uploads directory on server start
deleteAllFilesInUploads();

// Set up storage with multer
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads/");
	},
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}-${file.originalname}`);
	},
});

const upload = multer({ storage });

app.get("/", (req, res) => {
	res.send("Hello World");
});

// Endpoint to handle file upload
app.post("/upload", upload.single("pdf"), (req, res) => {
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

	res.send({ message: "File uploaded successfully", file: req.file });

	const axios = require("axios");

	const LinkedIn_API_Key = process.env.LinkedIn_API_Key;
	const apiEndpoint = "https://nubela.co/proxycurl/api/v2/linkedin/company/job";

	const params = {
		job_type: "anything",
		experience_level: "entry_level",
		when: "past-week",
		flexibility: "remote",
		keyword: "fullstack developer",
	};

	axios
		.get(apiEndpoint, {
			headers: {
				Authorization: `Bearer ${LinkedIn_API_Key}`,
				"Content-Type": "application/json",
			},
			params: params,
		})
		.then((response) => {
			console.log(response.data);
		})
		.catch((error) => {
			console.error("Error fetching data:", error);
		});
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
