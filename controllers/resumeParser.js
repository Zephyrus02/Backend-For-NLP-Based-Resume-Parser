// backend/controllers/resumeParser.js
const fs = require("fs");
const pdfParse = require("pdf-parse");
const axios = require("axios");
require("dotenv").config();

const resumeParser = async (req, res) => {
  try {
    const resumeFile = req.file;

    if (!resumeFile) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Log the file information
    console.log("File uploaded:", resumeFile);

    // Read the PDF file content
    const filePath = resumeFile.path; // Path to the uploaded file
    const fileBuffer = fs.readFileSync(filePath); // Read the file into a buffer

    // Log the file read status
    console.log("PDF file read successfully.");

    // Use pdf-parse to extract text from the PDF file
    const pdfData = await pdfParse(fileBuffer);
    const extractedText = pdfData.text; // Extracted text from the PDF

    // Log extracted text
    console.log("Extracted text from PDF:", extractedText);

    // Prepare a prompt for the OpenAI API
    const prompt = `
      You are a resume parser. Given the following resume text, extract key skills, experiences, and recommend suitable job roles:
      Resume: ${extractedText}
    `;

    // Send the extracted text to OpenAI's API
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
            content: prompt,
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

    // Log the API response
    console.log("OpenAI API response:", response.data);

    // Parse response to get job recommendations
    const jobRecommendation = response.data.choices[0].message.content;

    // Clean up the uploaded file if you don't want to keep it
    fs.unlinkSync(filePath);

    // Send the recommendation back to the client
    return res.status(200).json({ jobRecommendation });
  } catch (error) {
    console.error("Error parsing resume:", error.message);

    // Add more error details to the response
    return res.status(500).json({ error: "Failed to parse resume", details: error.message });
  }
};

module.exports = resumeParser;
