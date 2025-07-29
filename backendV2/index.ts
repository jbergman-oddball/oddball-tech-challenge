import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import fs, {writeFileSync } from "fs";
import axios from "axios";
import { Octokit } from "@octokit/rest";
import simpleGit from "simple-git";
import { join } from "path";
import cors from "cors";

dotenv.config();

interface UploadedFiles {
  resume?: Express.Multer.File[];
  job_description?: Express.Multer.File[];
}

const app = express();
const port = process.env.PORT || 3000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME!;
const REPO_NAME = "oddball-code-challenge-repo";
const BRANCH_NAME = "feature/initial-setup";

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Add CORS middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Add your frontend URLs
  credentials: true
}));

// Add JSON parsing middleware
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ 
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

app.post("/generate-challenge", upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "job_description", maxCount: 1 },
]), async (req, res) => {
  const files = req.files as UploadedFiles;
  let resumePath: string | undefined;
  let jdPath: string | undefined;

  try {
    if (!files?.resume?.[0] || !files?.job_description?.[0]) {
      return res.status(400).json({ 
        error: "Both resume and job description files are required." 
      });
    }

    resumePath = files.resume[0].path;
    jdPath = files.job_description[0].path;

    const resumeText = fs.readFileSync(resumePath, "utf-8");
    const jdText = fs.readFileSync(jdPath, "utf-8");

    if (!resumeText.trim() || !jdText.trim()) {
      return res.status(400).json({ 
        error: "Both files must contain text content." 
      });
    }

    const prompt = `You are an expert technical interviewer. Based on the resume below and the job description, generate a coding challenge that tests relevant skills. This coding challenge needs to be in text format, styled for a GitHub readme.

Resume:
${resumeText}

Job Description:
${jdText}

Generate a coding challenge with the following structure:
# Coding Challenge
## Problem Description
## Requirements
## Technical Specifications
## Evaluation Criteria
## Submission Instructions

Coding Challenge:`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4", // or "gpt-3.5-turbo"
        messages: [
          {
            role: "user",
            content: prompt,
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 30000 // 30 seconds
      }
    );

    const output = response.data.choices[0].message.content.trim();

    const repoInfo = await initializeGitRepo(output);
    console.log("Repository initialized:", repoInfo);
    res.json({ 
      challengeLink: repoInfo?.devUrl,
      githubRepo: repoInfo?.repoUrl
    });

  } catch (error) {
    console.error("Error generating challenge:", error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.message;

      if (status === 404) {
        return res.status(404).json({ error: "OpenAI endpoint not found." });
      } else if (status === 401) {
        return res.status(401).json({ error: "Invalid OpenAI API key." });
      } else if (status === 429) {
        return res.status(429).json({ error: "Rate limit exceeded. Try again later." });
      }

      return res.status(503).json({ error: `OpenAI service error: ${message}` });
    }

    res.status(500).json({ error: "Unexpected server error while generating challenge." });
  } finally {
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
});

async function initializeGitRepo(cdChallenge: string) {
    try {
    // 1. Create repo on GitHub
    console.log("📁 Creating GitHub repo...");
    // Generate a unique repo name to avoid conflicts
    const timestamp = Date.now();
    const uniqueRepoName = `${REPO_NAME}-${timestamp}`;

    const repoResponse = await octokit.rest.repos.createForAuthenticatedUser({
      name: uniqueRepoName,
      private: false,
      description: "Automated coding challenge repository",
      auto_init: true, 
    });

    console.log(`✅ Repository created: ${repoResponse.data.html_url}`);

    // 2. Clone repo locally
    const remoteUrl = `https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${uniqueRepoName}.git`;
    const localPath = join(process.cwd(), uniqueRepoName);

    console.log("📥 Cloning repo locally...");
    const git = simpleGit();
    await git.clone(remoteUrl);

    // 3. Write the README file
    console.log("📝 Writing README.md...");
    writeFileSync(
      join(localPath, "README.md"),
      `# ${uniqueRepoName}\n\n${cdChallenge}`
    );

    // 4. Create a new branch and push
    const repoGit = simpleGit(localPath);
    await repoGit.checkoutLocalBranch(BRANCH_NAME);
    await repoGit.add("README.md");
    await repoGit.commit("Add coding challenge README");
    await repoGit.push("origin", BRANCH_NAME);

    console.log("✅ All done. Branch pushed!");
    return {
      repoUrl: repoResponse.data.html_url,
      branchUrl: `${repoResponse.data.html_url}/tree/${BRANCH_NAME}`,
      devUrl: `https://vscode.dev/github/${GITHUB_USERNAME}/${uniqueRepoName}/tree/${BRANCH_NAME}`
    };
  } catch (err) {
    console.error("❌ Error:", err);
  }
}
