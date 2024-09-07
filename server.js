const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const upload = multer({ dest: "uploads/" });
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
	const directory = "uploads/";
	fs.readdir(directory, (err, files) => {
		if (err) throw err;
		for (const file of files) {
			fs.unlink(path.join(directory, file), (err) => {
				if (err) throw err;
				fs.appendFileSync("server.log", `Deleted file: ${file}\n`);
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

	const jobdata = {
		job: [
			{
				company: "Microsoft",
				company_url: "https://www.linkedin.com/company/microsoft",
				job_title:
					"Product Management: Intern Opportunities for University Students",
				job_url:
					"https://www.linkedin.com/jobs/view/product-management-intern-opportunities-for-university-students-at-microsoft-3203330682",
				list_date: "2022-10-09",
				location: "New York, NY",
			},
			{
				company: "Microsoft",
				company_url: "https://www.linkedin.com/company/microsoft",
				job_title: "Content Strategist",
				job_url:
					"https://www.linkedin.com/jobs/view/content-strategist-at-microsoft-3257692764",
				list_date: "2022-10-21",
				location: "United States",
			},
		],
		next_page_api_url:
			"http://nubela.co/proxycurl/proxycurl/api/v2/linkedin/company/job?pagination=eyJwYWdlIjogMX0\u0026search_id=1035",
		next_page_no: 1,
		previous_page_api_url: null,
		previous_page_no: null,
	};

	const params = {
		job_type: "anything",
		experience_level: "anything",
		when: "past-week",
		geo_id: 102713980,
		keyword: "fullstack developer",
		limit: 6,
	};

	try {
		const response = await axios.get(apiEndpoint, {
			headers: {
				Authorization: `Bearer ${LinkedIn_API_Key}`,
				"Content-Type": "application/json",
			},
			params: params,
		});

		logMessage(" -> Job data fetched successfully");
		return response.data.job; // Assuming response contains jobs array
	} catch (error) {
		logMessage(` -> Error fetching data: ${error.message}`);
		// throw error;
		return jobdata.job;
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

	// Schedule file deletion after 2 minutes
	setTimeout(() => {
		const filePath = path.join(__dirname, "uploads", req.file.filename);

		fs.unlink(filePath, (err) => {
			if (err) {
				logMessage(`Error deleting file: ${err.message}`);
			} else {
				logMessage(`File deleted successfully: ${req.file.filename}`);
			}
		});
	}, 120000); // 120000 milliseconds = 2 minutes

	// Fetch job data after successful upload
	try {
		const jobData = await fetchJobData();
		res.send({
			message: "File uploaded successfully",
			file: req.file,
			jobs: jobData,
		});
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
