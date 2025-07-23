import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";
import axios from "axios";

dotenv.config();

// Validate required environment variables
if (!process.env.HUGGINGFACE_API_KEY) {
  console.error("HUGGINGFACE_API_KEY environment variable is required");
  process.exit(1);
}

interface UploadedFiles {
  resume?: Express.Multer.File[];
  job_description?: Express.Multer.File[];
}

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({ 
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/generate-challenge", upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "job_description", maxCount: 1 },
]), async (req, res) => {
  const files = req.files as UploadedFiles;
  let resumePath: string | undefined;
  let jdPath: string | undefined;

  try {
    // Validate that both files were uploaded
    if (!files?.resume?.[0] || !files?.job_description?.[0]) {
      return res.status(400).json({ 
        error: "Both resume and job description files are required." 
      });
    }

    resumePath = files.resume[0].path;
    jdPath = files.job_description[0].path;

    // Read file contents
    const resumeText = fs.readFileSync(resumePath, "utf-8");
    const jdText = fs.readFileSync(jdPath, "utf-8");

    // Validate file contents
    if (!resumeText.trim() || !jdText.trim()) {
      return res.status(400).json({ 
        error: "Both files must contain text content." 
      });
    }

    const prompt = `You are an expert technical interviewer. Based on the resume below and the job description, generate a coding challenge that tests relevant skills.

Resume:
${resumeText}

Job Description:
${jdText}

Coding Challenge:`;

    const response = await axios.post(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        inputs: prompt,
        parameters: { max_new_tokens: 300 },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Validate API response
    if (!response.data?.[0]?.generated_text) {
      throw new Error("Invalid response from AI service");
    }

    res.json({ challenge: response.data[0].generated_text });
  } catch (error) {
    console.error("Error generating challenge:", error);
    
    if (axios.isAxiosError(error)) {
      return res.status(503).json({ 
        error: "AI service temporarily unavailable. Please try again later." 
      });
    }
    
    res.status(500).json({ 
      error: "Something went wrong generating the challenge." 
    });
  } finally {
    // Clean up uploaded files
    try {
      if (resumePath && fs.existsSync(resumePath)) {
        fs.unlinkSync(resumePath);
      }
      if (jdPath && fs.existsSync(jdPath)) {
        fs.unlinkSync(jdPath);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up files:", cleanupError);
    }
  }
});

app.listen(port, () => {
  console.log(`🚀 Resume Challenge API server running at http://localhost:${port}`);
  console.log(`📋 Health check available at http://localhost:${port}/health`);
});
