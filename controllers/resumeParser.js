const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

// Function to handle resume parsing
const resumeParser = async (req, res) => {
  try {
    const resumeFile = req.file;

    if (!resumeFile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Read the PDF file content
    const filePath = resumeFile.path;
    const fileContent = fs.readFileSync(filePath, { encoding: "base64" });

    // Send file content to OpenAI's API
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a resume parser. Given a resume in text form, extract key skills, experiences, and recommend suitable job roles.",
          },
          {
            role: "user",
            content: `Resume: ${fileContent}`,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Parse response to get job recommendations
    const jobRecommendation = response.data.choices[0].message.content;

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    // Send the recommendation back to the client
    return res.status(200).json({ jobRecommendation });
  } catch (error) {
    console.error("Error parsing resume:", error.message);
    return res.status(500).json({ error: "Failed to parse resume" });
  }
};

module.exports = resumeParser;
