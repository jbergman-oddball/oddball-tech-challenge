import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import fs, { writeFileSync } from "fs";
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

    const prompt = `You are an expert technical interviewer. Based on the resume below and the job description, generate a coding challenge that tests relevant skills. 

Resume:
${resumeText}

Job Description:
${jdText}

Please analyze the skills and technologies mentioned in both documents and respond with a JSON object containing:

1. "challenge" - A detailed coding challenge description in markdown format with sections: Problem Description, Requirements, Technical Specifications, Evaluation Criteria, Submission Instructions
2. "projectType" - The type of project (e.g., "web-app", "api", "cli-tool", "data-processing", "mobile-app")
3. "technologies" - Array of main technologies to use (e.g., ["typescript", "node", "express", "react"])
4. "difficulty" - "junior", "mid", or "senior"
5. "timeEstimate" - Estimated completion time (e.g., "2-4 hours")

Response format:
{
  "challenge": "# Coding Challenge\\n## Problem Description\\n...",
  "projectType": "web-app",
  "technologies": ["typescript", "react", "node"],
  "difficulty": "mid",
  "timeEstimate": "3-4 hours"
}`;

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
        max_tokens: 2000
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 30000 // 30 seconds
      }
    );

    const aiResponse = response.data.choices[0].message.content.trim();
    
    // Parse the JSON response from OpenAI
    let challengeData;
    try {
      challengeData = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", aiResponse);
      // Fallback to simple README if JSON parsing fails
      challengeData = {
        challenge: aiResponse,
        projectType: "web-app",
        technologies: ["typescript", "node"],
        difficulty: "mid",
        timeEstimate: "2-4 hours"
      };
    }

    const repoInfo = await initializeGitRepo(challengeData);
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

async function initializeGitRepo(challengeData: any) {
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
    await git.clone(remoteUrl, localPath);

    // 3. Create project structure based on challenge data
    console.log("🏗️ Creating project structure...");
    await createProjectStructure(localPath, challengeData);

    // 4. Create a new branch and push
    const repoGit = simpleGit(localPath);
    await repoGit.checkoutLocalBranch(BRANCH_NAME);
    await repoGit.add(".");
    await repoGit.commit("Initial project setup with coding challenge");
    await repoGit.push("origin", BRANCH_NAME);

    // 5. Clean up local repository
    console.log("🧹 Cleaning up local files...");
    fs.rmSync(localPath, { recursive: true, force: true });

    console.log("✅ All done. Branch pushed!");
    return {
      repoUrl: repoResponse.data.html_url,
      branchUrl: `${repoResponse.data.html_url}/tree/${BRANCH_NAME}`,
      devUrl: `https://vscode.dev/github/${GITHUB_USERNAME}/${uniqueRepoName}/tree/${BRANCH_NAME}`
    };
  } catch (err) {
    console.error("❌ Error:", err);
    throw err;
  }
}

async function createProjectStructure(localPath: string, challengeData: any) {
  const { challenge, projectType, technologies, difficulty, timeEstimate } = challengeData;

  // Create README.md
  writeFileSync(
    join(localPath, "README.md"),
    challenge
  );

  // Create .gitignore
  const gitignoreContent = generateGitignore(technologies);
  writeFileSync(join(localPath, ".gitignore"), gitignoreContent);

  // Create project-specific files based on technologies
  if (technologies.includes("typescript") || technologies.includes("node")) {
    await createNodeProject(localPath, technologies, projectType);
  }
  
  if (technologies.includes("react") || technologies.includes("nextjs")) {
    await createReactProject(localPath, technologies, projectType);
  }
  
  if (technologies.includes("python")) {
    await createPythonProject(localPath, technologies, projectType);
  }

  if (technologies.includes("java")) {
    await createJavaProject(localPath, technologies, projectType);
  }

  // Create common development files
  await createCommonFiles(localPath, challengeData);
}

function generateGitignore(technologies: string[]): string {
  let gitignore = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Build outputs
dist/
build/
*.tgz
*.tar.gz

`;

  if (technologies.includes("python")) {
    gitignore += `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
env.bak/
venv.bak/
.pytest_cache/

`;
  }

  if (technologies.includes("java")) {
    gitignore += `# Java
*.class
*.jar
*.war
*.ear
*.nar
hs_err_pid*
target/

`;
  }

  if (technologies.includes("react") || technologies.includes("nextjs")) {
    gitignore += `# React/Next.js
.next/
out/
.vercel
*.tsbuildinfo

`;
  }

  return gitignore;
}

async function createNodeProject(localPath: string, technologies: string[], projectType: string) {
  // Create package.json
  const packageJson = {
    name: "coding-challenge",
    version: "1.0.0",
    description: "Coding challenge project",
    main: technologies.includes("typescript") ? "dist/index.js" : "index.js",
    scripts: {
      start: technologies.includes("typescript") ? "node dist/index.js" : "node index.js",
      dev: technologies.includes("typescript") ? "ts-node src/index.ts" : "node index.js",
      build: technologies.includes("typescript") ? "tsc" : "echo 'No build step required'",
      test: "jest"
    },
    dependencies: {},
    devDependencies: {}
  };

  if (technologies.includes("typescript")) {
    packageJson.devDependencies = {
      "@types/node": "^20.0.0",
      "typescript": "^5.0.0",
      "ts-node": "^10.9.0",
      "@types/jest": "^29.0.0"
    };
  }

  if (technologies.includes("express")) {
    packageJson.dependencies = {
      ...packageJson.dependencies,
      express: "^4.18.0"
    };
    if (technologies.includes("typescript")) {
      packageJson.devDependencies = {
        ...packageJson.devDependencies,
        "@types/express": "^4.17.0"
      };
    }
  }

  packageJson.devDependencies = {
    ...packageJson.devDependencies,
    jest: "^29.0.0"
  };

  writeFileSync(join(localPath, "package.json"), JSON.stringify(packageJson, null, 2));

  // Create TypeScript config if needed
  if (technologies.includes("typescript")) {
    const tsConfig = {
      compilerOptions: {
        target: "ES2020",
        module: "commonjs",
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"]
    };
    writeFileSync(join(localPath, "tsconfig.json"), JSON.stringify(tsConfig, null, 2));

    // Create src directory with basic files
    const srcDir = join(localPath, "src");
    fs.mkdirSync(srcDir, { recursive: true });

    if (technologies.includes("express")) {
      const indexContent = `import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello World! Your coding challenge starts here.' });
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});
`;
      writeFileSync(join(srcDir, "index.ts"), indexContent);
    } else {
      const indexContent = `console.log('Hello World! Your coding challenge starts here.');

// TODO: Implement your solution here
export {};
`;
      writeFileSync(join(srcDir, "index.ts"), indexContent);
    }
  } else {
    // Create basic JavaScript files
    if (technologies.includes("express")) {
      const indexContent = `const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello World! Your coding challenge starts here.' });
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});
`;
      writeFileSync(join(localPath, "index.js"), indexContent);
    } else {
      const indexContent = `console.log('Hello World! Your coding challenge starts here.');

// TODO: Implement your solution here
`;
      writeFileSync(join(localPath, "index.js"), indexContent);
    }
  }

  // Create test directory
  const testDir = join(localPath, technologies.includes("typescript") ? "src/__tests__" : "tests");
  fs.mkdirSync(testDir, { recursive: true });
  
  const testContent = `// Add your tests here
describe('Coding Challenge Tests', () => {
  test('should pass this example test', () => {
    expect(true).toBe(true);
  });
});
`;
  writeFileSync(join(testDir, "index.test." + (technologies.includes("typescript") ? "ts" : "js")), testContent);
}

async function createReactProject(localPath: string, technologies: string[], projectType: string) {
  // This would be more complex for a full React setup
  // For now, we'll create a simple HTML file with React CDN
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Coding Challenge</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        function App() {
            return (
                <div>
                    <h1>Coding Challenge</h1>
                    <p>Your React application starts here!</p>
                </div>
            );
        }

        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
</body>
</html>`;
  writeFileSync(join(localPath, "index.html"), htmlContent);
}

async function createPythonProject(localPath: string, technologies: string[], projectType: string) {
  // Create requirements.txt
  let requirements = `# Add your Python dependencies here
pytest>=7.0.0
`;

  if (technologies.includes("flask")) {
    requirements += "flask>=2.0.0\n";
  }
  if (technologies.includes("django")) {
    requirements += "django>=4.0.0\n";
  }
  if (technologies.includes("fastapi")) {
    requirements += "fastapi>=0.68.0\nuvicorn>=0.15.0\n";
  }

  writeFileSync(join(localPath, "requirements.txt"), requirements);

  // Create main Python file
  let mainContent = `#!/usr/bin/env python3
"""
Coding Challenge Solution

TODO: Implement your solution here
"""

def main():
    print("Hello World! Your coding challenge starts here.")
    # TODO: Implement your solution

if __name__ == "__main__":
    main()
`;

  if (technologies.includes("flask")) {
    mainContent = `#!/usr/bin/env python3
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify({"message": "Hello World! Your coding challenge starts here."})

if __name__ == "__main__":
    app.run(debug=True)
`;
  }

  writeFileSync(join(localPath, "main.py"), mainContent);

  // Create test file
  const testContent = `import unittest
from main import *

class TestCodingChallenge(unittest.TestCase):
    def test_example(self):
        self.assertTrue(True)
        
    # TODO: Add your tests here

if __name__ == '__main__':
    unittest.main()
`;
  writeFileSync(join(localPath, "test_main.py"), testContent);
}

async function createJavaProject(localPath: string, technologies: string[], projectType: string) {
  // Create basic Maven structure
  const srcMainJava = join(localPath, "src", "main", "java", "com", "example");
  const srcTestJava = join(localPath, "src", "test", "java", "com", "example");
  
  fs.mkdirSync(srcMainJava, { recursive: true });
  fs.mkdirSync(srcTestJava, { recursive: true });

  // Create pom.xml
  const pomXml = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.example</groupId>
    <artifactId>coding-challenge</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.13.2</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>`;
  writeFileSync(join(localPath, "pom.xml"), pomXml);

  // Create main Java file
  const mainJava = `package com.example;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World! Your coding challenge starts here.");
        // TODO: Implement your solution
    }
}`;
  writeFileSync(join(srcMainJava, "Main.java"), mainJava);

  // Create test file
  const testJava = `package com.example;

import org.junit.Test;
import static org.junit.Assert.*;

public class MainTest {
    @Test
    public void testExample() {
        assertTrue(true);
        // TODO: Add your tests here
    }
}`;
  writeFileSync(join(srcTestJava, "MainTest.java"), testJava);
}

async function createCommonFiles(localPath: string, challengeData: any) {
  // Create INSTRUCTIONS.md
  const instructions = `# Setup Instructions

## Prerequisites
${challengeData.technologies.includes("node") || challengeData.technologies.includes("typescript") ? "- Node.js 18+ installed" : ""}
${challengeData.technologies.includes("python") ? "- Python 3.8+ installed" : ""}
${challengeData.technologies.includes("java") ? "- Java 11+ and Maven installed" : ""}

## Getting Started

1. Clone this repository
2. Install dependencies:
${challengeData.technologies.includes("node") || challengeData.technologies.includes("typescript") ? "   \`\`\`bash\n   npm install\n   \`\`\`" : ""}
${challengeData.technologies.includes("python") ? "   \`\`\`bash\n   pip install -r requirements.txt\n   \`\`\`" : ""}
${challengeData.technologies.includes("java") ? "   \`\`\`bash\n   mvn install\n   \`\`\`" : ""}

3. Start development:
${challengeData.technologies.includes("typescript") ? "   \`\`\`bash\n   npm run dev\n   \`\`\`" : ""}
${challengeData.technologies.includes("node") && !challengeData.technologies.includes("typescript") ? "   \`\`\`bash\n   npm start\n   \`\`\`" : ""}
${challengeData.technologies.includes("python") ? "   \`\`\`bash\n   python main.py\n   \`\`\`" : ""}
${challengeData.technologies.includes("java") ? "   \`\`\`bash\n   mvn exec:java -Dexec.mainClass=\"com.example.Main\"\n   \`\`\`" : ""}

4. Run tests:
${challengeData.technologies.includes("node") || challengeData.technologies.includes("typescript") ? "   \`\`\`bash\n   npm test\n   \`\`\`" : ""}
${challengeData.technologies.includes("python") ? "   \`\`\`bash\n   python -m pytest\n   \`\`\`" : ""}
${challengeData.technologies.includes("java") ? "   \`\`\`bash\n   mvn test\n   \`\`\`" : ""}

## Time Estimate
${challengeData.timeEstimate}

## Difficulty Level
${challengeData.difficulty}

## Submission
When complete, push your changes to a new branch and create a pull request with your solution.
`;

  writeFileSync(join(localPath, "INSTRUCTIONS.md"), instructions);

  // Create SOLUTION.md template
  const solutionTemplate = `# Solution Documentation

## Approach
Describe your approach to solving this challenge.

## Implementation Details
Explain the key parts of your implementation.

## Trade-offs and Decisions
Discuss any trade-offs you made and why.

## Time Spent
How much time did you spend on this challenge?

## Additional Notes
Any other notes or thoughts about your solution.
`;

  writeFileSync(join(localPath, "SOLUTION.md"), solutionTemplate);
}
