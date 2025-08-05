import React, { useState, useCallback } from 'react';
import { Upload, FileText, Github, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface UploadedFile {
  file: File;
  preview: string;
}

interface ChallengeResult {
  challengeLink: string;
  githubRepo: string;
  message?: string;
}

function App() {
  const [resumeFile, setResumeFile] = useState<UploadedFile | null>(null);
  const [jobDescFile, setJobDescFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback((file: File, type: 'resume' | 'jobdesc') => {
    const preview = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    const uploadedFile = { file, preview };
    
    if (type === 'resume') {
      setResumeFile(uploadedFile);
    } else {
      setJobDescFile(uploadedFile);
    }
    
    // Clear any previous errors
    setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, type: 'resume' | 'jobdesc') => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0], type);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'resume' | 'jobdesc') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0], type);
    }
  }, [handleFileUpload]);

  const removeFile = useCallback((type: 'resume' | 'jobdesc') => {
    if (type === 'resume') {
      setResumeFile(null);
    } else {
      setJobDescFile(null);
    }
  }, []);

  const submitFiles = async () => {
    if (!resumeFile || !jobDescFile) {
      setError('Please upload both files before generating the challenge.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile.file);
      formData.append('job_description', jobDescFile.file);

      const response = await fetch('http://localhost:6969/generate-challenge', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while generating the challenge.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setResumeFile(null);
    setJobDescFile(null);
    setResult(null);
    setError(null);
  };

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full border border-gray-100">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Challenge Generated!</h1>
            <p className="text-gray-600">Your personalized coding challenge is ready</p>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center mb-3">
                <ExternalLink className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-900">Coding Challenge</h3>
              </div>
              <a 
                href={result.challengeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline break-all transition-colors"
              >
                {result.challengeLink}
              </a>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-100">
              <div className="flex items-center mb-3">
                <Github className="w-5 h-5 text-gray-700 mr-2" />
                <h3 className="font-semibold text-gray-900">GitHub Repository</h3>
              </div>
              <a 
                href={result.githubRepo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-900 underline break-all transition-colors"
              >
                {result.githubRepo}
              </a>
            </div>

            {result.message && (
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <p className="text-yellow-800">{result.message}</p>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={resetForm}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Generate Another Challenge
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full border border-gray-100">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Coding Challenge Generator</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload your resume and a job description to generate a personalized coding challenge. 
            We'll create a GitHub repository with tailored tasks based on the role requirements.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Resume Upload */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              1. Upload Your Resume
            </label>
            <div
              onDrop={(e) => handleDrop(e, 'resume')}
              onDragOver={handleDragOver}
              className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer group"
            >
              {resumeFile ? (
                <div className="space-y-3">
                  <FileText className="w-12 h-12 text-green-600 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">{resumeFile.preview}</p>
                  <button
                    onClick={() => removeFile('resume')}
                    className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-gray-400 group-hover:text-blue-600 mx-auto transition-colors" />
                  <div>
                    <p className="text-gray-700 font-medium">Drop your resume here</p>
                    <p className="text-gray-500 text-sm">or click to browse</p>
                  </div>
                  <p className="text-xs text-gray-400">PDF, DOC, DOCX, TXT (max 10MB)</p>
                </div>
              )}
              <input
                type="file"
                onChange={(e) => handleFileInputChange(e, 'resume')}
                accept=".pdf,.doc,.docx,.txt"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Job Description Upload */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              2. Upload Job Description
            </label>
            <div
              onDrop={(e) => handleDrop(e, 'jobdesc')}
              onDragOver={handleDragOver}
              className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer group"
            >
              {jobDescFile ? (
                <div className="space-y-3">
                  <FileText className="w-12 h-12 text-green-600 mx-auto" />
                  <p className="text-sm font-medium text-gray-900">{jobDescFile.preview}</p>
                  <button
                    onClick={() => removeFile('jobdesc')}
                    className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-gray-400 group-hover:text-blue-600 mx-auto transition-colors" />
                  <div>
                    <p className="text-gray-700 font-medium">Drop job description here</p>
                    <p className="text-gray-500 text-sm">or click to browse</p>
                  </div>
                  <p className="text-xs text-gray-400">PDF, DOC, DOCX, TXT (max 10MB)</p>
                </div>
              )}
              <input
                type="file"
                onChange={(e) => handleFileInputChange(e, 'jobdesc')}
                accept=".pdf,.doc,.docx,.txt"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={submitFiles}
            disabled={!resumeFile || !jobDescFile || isUploading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center mx-auto min-w-[200px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Challenge...
              </>
            ) : (
              <>
                <Github className="w-5 h-5 mr-2" />
                Generate Challenge
              </>
            )}
          </button>
          
          <p className="text-xs text-gray-500 mt-4 max-w-lg mx-auto">
            3. Click "Generate Challenge" to create your personalized coding challenge and GitHub repository
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-blue-600 font-bold text-sm">1</span>
              </div>
              <h3 className="font-medium text-gray-900">Upload Files</h3>
              <p className="text-xs text-gray-600">Resume and job description</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-blue-600 font-bold text-sm">2</span>
              </div>
              <h3 className="font-medium text-gray-900">AI Analysis</h3>
              <p className="text-xs text-gray-600">Match skills to requirements</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-blue-600 font-bold text-sm">3</span>
              </div>
              <h3 className="font-medium text-gray-900">Get Challenge</h3>
              <p className="text-xs text-gray-600">Personalized coding tasks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;