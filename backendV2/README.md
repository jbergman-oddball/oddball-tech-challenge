# Resume Challenge Backend API

Express.js backend service that generates personalized coding challenges using AI based on resume and job description analysis.

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh) runtime (recommended) or Node.js 18+
- GitHub personal access token
- OpenAI API key

### Installation

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env-example .env
# Edit .env with your API keys (see main README for details)

# Start the server
bun start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## 🔧 Environment Setup

Create a `.env` file with the following variables:

```env
PORT=3000
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_USERNAME=your_github_username
OPENAI_API_KEY=your_openai_api_key
```

For detailed instructions on obtaining API keys, see the main project README.

## 📋 API Endpoints

### POST `/generate-challenge`

Generates a coding challenge and creates a GitHub repository.

**Content-Type**: `multipart/form-data`

**Body**:
- `resume`: Resume file (PDF/TXT, max 5MB)
- `job_description`: Job description file (PDF/TXT, max 5MB)

**Response**:
```json
{
  "challengeLink": "https://vscode.dev/github/username/repo-timestamp/tree/feature/initial-setup",
  "githubRepo": "https://github.com/username/repo-timestamp"
}
```

**Error Responses**:
- `400`: Missing files or invalid content
- `401`: Invalid OpenAI API key
- `429`: Rate limit exceeded
- `500`: Server error

## 🛠️ Development

### Scripts

```bash
# Start development server
bun start

# Install new dependencies
bun add <package-name>

# Run with nodemon (if using Node.js)
npm run dev
```
