# Oddball Tech Challenge - Resume-Based Coding Challenge Generator

This application generates personalized coding challenges based on a candidate's resume and job description using AI. It creates a GitHub repository with the challenge and provides a development environment link.

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Express.js with TypeScript (running on Bun)
- **AI Integration**: OpenAI GPT-4 for challenge generation
- **Version Control**: GitHub API for repository creation
- **File Processing**: Multer for resume and job description uploads

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or [Bun](https://bun.sh) runtime
- GitHub account with personal access token
- OpenAI API account

### 1. Clone and Install

```bash
git clone https://github.com/jbergman-oddball/oddball-tech-challenge.git
cd oddball-tech-challenge

# Install frontend dependencies
npm install

# Install backend dependencies
cd backendV2
bun install
```

### 2. Set Up Environment Variables

#### Backend Configuration

1. Copy the environment template:
```bash
cd backendV2
cp .env-example .env
```

2. Edit `.env` with your API keys:
```env
PORT=3000
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_USERNAME=your_github_username
OPENAI_API_KEY=your_openai_api_key
```

### 3. Get Required API Keys

#### GitHub Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `public_repo` (Access public repositories)
4. Copy the generated token to your `.env` file

#### OpenAI API Key

1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the API key to your `.env` file
5. **Note**: You'll need credits in your OpenAI account to use the API

### 4. Run the Application

#### Start Backend Server
```bash
cd backendV2
bun start
# Server runs on http://localhost:3000
```

#### Start Frontend (in a new terminal)
```bash
# From project root
npm run dev
# Frontend runs on http://localhost:3001 (or next available port)
```

## 📋 How to Use

1. **Upload Files**: Select a resume (PDF/TXT) and job description (PDF/TXT)
2. **Generate Challenge**: Click "Generate Challenge" to create an AI-powered coding challenge
3. **Access Repository**: Get links to:
   - GitHub repository with the challenge
   - VS Code Dev environment for immediate coding

## 🔧 API Endpoints

### POST `/generate-challenge`

Generates a coding challenge based on uploaded files.

**Request**: Multipart form data
- `resume`: Resume file (PDF/TXT, max 5MB)
- `job_description`: Job description file (PDF/TXT, max 5MB)

**Response**:
```json
{
  "challengeLink": "https://vscode.dev/github/username/repo/tree/branch",
  "githubRepo": "https://github.com/username/repo"
}
```

## 🛠️ Development

### Project Structure

```
oddball-tech-challenge/
├── src/                    # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   └── lib/              # Utilities
├── backendV2/            # Express.js backend
│   ├── index.ts          # Main server file
│   ├── uploads/          # Temporary file storage
│   └── package.json      # Backend dependencies
└── README.md
```

### Tech Stack

**Frontend:**
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- React Hook Form
- Shadcn/ui components

**Backend:**
- Express.js
- TypeScript
- Bun runtime
- Multer (file uploads)
- Axios (HTTP client)
- Octokit (GitHub API)
- simple-git (Git operations)

## 🔒 Security Notes

- API keys are stored in environment variables
- File uploads are limited to 5MB
- Temporary files are automatically cleaned up
- CORS is configured for specific origins

## 📝 Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `PORT` | Backend server port | No | `3000` |
| `GITHUB_TOKEN` | GitHub personal access token | Yes | `ghp_xxxxxxxxxxxx` |
| `GITHUB_USERNAME` | Your GitHub username | Yes | `yourusername` |
| `OPENAI_API_KEY` | OpenAI API key | Yes | `sk-xxxxxxxxxxxx` |

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid OpenAI API key"**
   - Verify your API key is correct
   - Check if you have credits in your OpenAI account

2. **"GitHub permission denied"**
   - Ensure your GitHub token has `repo` permissions
   - Verify the username matches the token owner

3. **"File upload failed"**
   - Check file size is under 5MB
   - Ensure file contains readable text content

4. **Port already in use**
   - Change the `PORT` in your `.env` file
   - Kill existing processes: `lsof -ti:3000 | xargs kill`

## 📄 License

This project is part of the Oddball technical challenge.

## 🤝 Contributing

This is a technical challenge project. For questions or issues, please contact the development team.
