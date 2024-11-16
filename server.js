const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const upload = multer({ dest: "uploads/" });
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

// Initialize express app
const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Connect to MongoDB
mongoose
	.connect(process.env.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log("Connected to MongoDB"))
	.catch((err) => console.error("Error connecting to MongoDB:", err));

// User model
const User = mongoose.model("User", {
	username: String,
	password: String,
});

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
const fetchJobData = async (job_title) => {
	const LinkedIn_API_Key = process.env.LinkedIn_API_Key;
	const apiEndpoint = process.env.LinkedIn_API_Endpoint;

	const params = {
		job_type: "anything",
		experience_level: "anything",
		when: "past-week",
		geo_id: 102713980,
		keyword: job_title,
	};

	// Testing job data
	const jobdata = {
		job: [
			{
				company: "Jio",
				company_url: "https://www.linkedin.com/company/jio",
				job_title: "Fullstack Developer",
				job_url:
					"https://www.linkedin.com/jobs/view/fullstack-developer-at-jio-4019918545",
				list_date: "2024-09-08",
				location: "Gurgaon, Haryana, India",
			},
			{
				company: "Jio",
				company_url: "https://www.linkedin.com/company/jio",
				job_title: "Fullstack Developer",
				job_url:
					"https://www.linkedin.com/jobs/view/fullstack-developer-at-jio-4019919642",
				list_date: "2024-09-08",
				location: "Navi Mumbai, Maharashtra, India",
			},
			{
				company: "Codebase",
				company_url: "https://www.linkedin.com/company/codebasedotcom",
				job_title: "FullStack Web Developer",
				job_url:
					"https://www.linkedin.com/jobs/view/fullstack-web-developer-at-codebase-4021578087",
				list_date: "2024-09-09",
				location: "Pune, Maharashtra, India",
			},
			{
				company: "Citi",
				company_url: "https://www.linkedin.com/company/citi",
				job_title: "React Developer",
				job_url:
					"https://www.linkedin.com/jobs/view/react-developer-at-citi-4020457169",
				list_date: "2024-09-09",
				location: "Pune, Maharashtra, India",
			},
			{
				company: "Maple Green Recruitment Services",
				company_url:
					"https://www.linkedin.com/company/maple-green-recruitment-services",
				job_title: "Fullstack Developer",
				job_url:
					"https://www.linkedin.com/jobs/view/fullstack-developer-at-maple-green-recruitment-services-4019977208",
				list_date: "2024-09-09",
				location: "Bengaluru, Karnataka, India",
			},
			{
				company: "Petpooja",
				company_url:
					"https://www.linkedin.com/company/petpooja-prayosha-food-service-pvt-ltd-",
				job_title: "PHP Fullstack Developer",
				job_url:
					"https://www.linkedin.com/jobs/view/php-fullstack-developer-at-petpooja-4019901200",
				list_date: "2024-09-08",
				location: "Ahmedabad, Gujarat, India",
			},
			{
				company: "Weekday (YC W21)",
				company_url: "https://www.linkedin.com/company/weekdayworks",
				job_title: "FullStack Developer",
				job_url:
					"https://www.linkedin.com/jobs/view/fullstack-developer-at-weekday-yc-w21-4014539061",
				list_date: "2024-09-04",
				location: "Bengaluru, Karnataka, India",
			},
			{
				company: "Whitefield Careers",
				company_url: "https://www.linkedin.com/company/whitefield-careers",
				job_title: "Fullstack Developer",
				job_url:
					"https://www.linkedin.com/jobs/view/fullstack-developer-at-whitefield-careers-4013967917",
				list_date: "2024-09-03",
				location: "Bengaluru, Karnataka, India",
			},
			{
				company: "Fractal",
				company_url: "https://www.linkedin.com/company/fractal-analytics",
				job_title: "Fullstack Developer",
				job_url:
					"https://www.linkedin.com/jobs/view/fullstack-developer-at-fractal-3631867155",
				list_date: "2024-09-06",
				location: "Bengaluru, Karnataka, India",
			},
			{
				company: "Infosys",
				company_url: "https://www.linkedin.com/company/infosys",
				job_title: "Full Stack Engineer",
				job_url:
					"https://www.linkedin.com/jobs/view/full-stack-engineer-at-infosys-4004306993",
				list_date: "2024-09-05",
				location: "Bengaluru, Karnataka, India",
			},
			{
				company: "Whitefield Careers",
				company_url: "https://www.linkedin.com/company/whitefield-careers",
				job_title: "Java Developer",
				job_url:
					"https://www.linkedin.com/jobs/view/java-developer-at-whitefield-careers-4015802705",
				list_date: "2024-09-05",
				location: "Bengaluru, Karnataka, India",
			},
			{
				company: "TITAN CONSULTANCY",
				company_url: "https://www.linkedin.com/company/titan-consultancy",
				job_title: "FULLSTACK DEVELOPER REACT JS",
				job_url:
					"https://www.linkedin.com/jobs/view/fullstack-developer-react-js-at-titan-consultancy-4019691814",
				list_date: "2024-09-08",
				location: "Bengaluru, Karnataka, India",
			},
			{
				company: "Orbion Infotech",
				company_url: "https://www.linkedin.com/company/orbion-infotech",
				job_title: "Full stack developer-Immediate joiner-Remote",
				job_url:
					"https://www.linkedin.com/jobs/view/full-stack-developer-immediate-joiner-remote-at-orbion-infotech-4016745988",
				list_date: "2024-09-06",
				location: "India",
			},
			{
				company: "Techerudite",
				company_url: "https://www.linkedin.com/company/techerudite",
				job_title: "Javascript Developer",
				job_url:
					"https://www.linkedin.com/jobs/view/javascript-developer-at-techerudite-4019676703",
				list_date: "2024-09-08",
				location: "Ahmedabad, Gujarat, India",
			},
			{
				company: "Talentbot Technologies",
				company_url: "https://www.linkedin.com/company/talentbottechnologies",
				job_title: "Fullstack Developer - A6478",
				job_url:
					"https://www.linkedin.com/jobs/view/fullstack-developer-a6478-at-talentbot-technologies-4021673146",
				list_date: "2024-09-09",
				location: "Hyderabad, Telangana, India",
			},
			{
				company: "Fractal",
				company_url: "https://www.linkedin.com/company/fractal-analytics",
				job_title: "Full Stack Developer(React.js + Python)",
				job_url:
					"https://www.linkedin.com/jobs/view/full-stack-developer-react-js-%2B-python-at-fractal-3982753246",
				list_date: "2024-09-08",
				location: "Bengaluru, Karnataka, India",
			},
			{
				company: "Information Dynamics",
				company_url: "https://www.linkedin.com/company/infodynamicsoff",
				job_title: "Java Developer / Fullstack Developer",
				job_url:
					"https://www.linkedin.com/jobs/view/java-developer-fullstack-developer-at-information-dynamics-4019680549",
				list_date: "2024-09-08",
				location: "Chennai, Tamil Nadu, India",
			},
			{
				company: "r3 Consultant",
				company_url: "https://www.linkedin.com/company/r3consultant",
				job_title: "Fullstack Javascript Developer",
				job_url:
					"https://www.linkedin.com/jobs/view/fullstack-javascript-developer-at-r3-consultant-4019685731",
				list_date: "2024-09-08",
				location: "Pune, Maharashtra, India",
			},
			{
				company: "r3 Consultant",
				company_url: "https://www.linkedin.com/company/r3consultant",
				job_title: "Fullstack Javascript Developer",
				job_url:
					"https://www.linkedin.com/jobs/view/fullstack-javascript-developer-at-r3-consultant-4019684490",
				list_date: "2024-09-08",
				location: "Pune, Maharashtra, India",
			},
			{
				company: "r3 Consultant",
				company_url: "https://www.linkedin.com/company/r3consultant",
				job_title: "Fullstack Javascript Developer",
				job_url:
					"https://www.linkedin.com/jobs/view/fullstack-javascript-developer-at-r3-consultant-4019691042",
				list_date: "2024-09-08",
				location: "Pune, Maharashtra, India",
			},
			{
				company: "r3 Consultant",
				company_url: "https://www.linkedin.com/company/r3consultant",
				job_title: "Fullstack Javascript Developer",
				job_url:
					"https://www.linkedin.com/jobs/view/fullstack-javascript-developer-at-r3-consultant-4019690206",
				list_date: "2024-09-08",
				location: "Pune, Maharashtra, India",
			},
			{
				company: "Amber",
				company_url: "https://www.linkedin.com/company/amberstudent",
				job_title: "Associate Software Engineer-Fullstack",
				job_url:
					"https://www.linkedin.com/jobs/view/associate-software-engineer-fullstack-at-amber-4019094433",
				list_date: "2024-09-06",
				location: "Pune, Maharashtra, India",
			},
			{
				company: "Blaash.io",
				company_url: "https://www.linkedin.com/company/blaash-io",
				job_title: "Fullstack Developer",
				job_url:
					"https://www.linkedin.com/jobs/view/fullstack-developer-at-blaash-io-4019688372",
				list_date: "2024-09-08",
				location: "Bengaluru, Karnataka, India",
			},
			{
				company: "Techerudite",
				company_url: "https://www.linkedin.com/company/techerudite",
				job_title: "Javascript Developer",
				job_url:
					"https://www.linkedin.com/jobs/view/javascript-developer-at-techerudite-4019683205",
				list_date: "2024-09-08",
				location: "Ahmedabad, Gujarat, India",
			},
			{
				company: "GITS Solutions (Global IT Staffing)",
				company_url: "https://www.linkedin.com/company/globalitstaffing",
				job_title: "FullStack Developer - Java & Angular",
				job_url:
					"https://www.linkedin.com/jobs/view/fullstack-developer-java-angular-at-gits-solutions-global-it-staffing-4020450730",
				list_date: "2024-09-09",
				location: "Bengaluru, Karnataka, India",
			},
		],
		next_page_no: 1,
		next_page_api_url:
			"https://nubela.co/proxycurl/api/v2/linkedin/company/job?pagination=eyJwYWdlIjogMSwgIm1ldGhvZCI6ICJmYWNlYm9vayIsICJqb2JzX29mZnNldCI6IDI1fQ&keyword=FullStack+Developer&geo_id=102713980&when=past-week",
		previous_page_no: null,
		previous_page_api_url: null,
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

		console.log(response.data);

		return { jobs: response.data.job };
	} catch (error) {
		logMessage(` -> Error fetching data: ${error.message}`);
		// throw error;

		return { jobs: jobdata.job };
	}
};

// Function to parser resume
const parseResume = async (filePath) => {
	let job_title = "";
	await axios
		.post("http://127.0.0.1:5001/send-file-path", {
			file_path: filePath,
		})
		.then((response) => {
			console.log("Response from Flask API:", response.data);
			job_title = response.data;
		})
		.catch((error) => {
			console.error("Error:", error);
		});

	return job_title;
};

// Function to get course recommendations
const getCourses = async (filePath) => {
	let courses = "";
	await axios
		.post("http://127.0.0.1:5001/get-courses", {
			file_path: filePath,
		})
		.then((response) => {
			console.log("Response from Flask API:", response.data);
			courses = response.data;
		})
		.catch((error) => {
			console.error("Error:", error);
		});

	return courses;
};

// Registration endpoint
app.post("/register", async (req, res) => {
	try {
		const { username, password } = req.body;
		const hashedPassword = await bcrypt.hash(password, 10);
		const user = new User({ username, password: hashedPassword });
		await user.save();
		res.status(201).json({ message: "User registered successfully" });
	} catch (error) {
		res.status(500).json({ message: "Error registering user" });
	}
});

// Login endpoint
app.post("/login", async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await User.findOne({ username });
		if (!user) {
			return res.status(400).json({ message: "Invalid credentials" });
		}
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({ message: "Invalid credentials" });
		}
		const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});

		// Set the token as an HTTP-only cookie
		res.cookie("token", token, {
			httpOnly: true,
			maxAge: 3600000, // 1 hour in milliseconds
			secure: process.env.NODE_ENV === "production", // Use secure cookies in production
			sameSite: "strict",
		});

		res.json({ message: "Logged in successfully" });
	} catch (error) {
		res.status(500).json({ message: "Error logging in" });
	}
});

// Logout endpoint
app.post("/logout", (req, res) => {
	res.clearCookie("token");
	res.json({ message: "Logged out successfully" });
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
	const token = req.cookies.token;
	if (!token)
		return res
			.status(401)
			.json({ message: "Access denied. No token provided." });

	try {
		const verified = jwt.verify(token, process.env.JWT_SECRET);
		req.user = verified;
		next();
	} catch (error) {
		res.status(400).json({ message: "Invalid token" });
	}
};

// Update the upload endpoint to use the verifyToken middleware
app.post("/upload", verifyToken, upload.single("pdf"), async (req, res) => {
	if (!req.file) {
		const errorMessage = "Error: No file uploaded.";
		logMessage(errorMessage);
		return res.status(400).send("No file uploaded.");
	}

	const successMessage = `File uploaded successfully: ${req.file.filename}`;
	logMessage(successMessage);

	const filePath = path.join(__dirname, "uploads", req.file.filename);

	let job_title = await parseResume(filePath);
	let course = await getCourses(filePath); // Get course recommendations

	// Schedule file deletion after 2 minutes
	setTimeout(() => {
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
		const { jobs } = await fetchJobData(job_title);
		res.send({
			job_title: job_title,
			message: "File uploaded successfully",
			file: req.file,
			jobs: jobs,
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

// Add a new endpoint to check authentication status
app.get("/check-auth", verifyToken, (req, res) => {
	res.json({ isAuthenticated: true });
});

app.get("/", (req, res) => {
	res.send("Hello World!");
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	const startupMessage = `Server is running on port ${PORT}`;
	logMessage(startupMessage);
	console.log(startupMessage);
});
