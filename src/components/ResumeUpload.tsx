import React, { useState, useCallback } from 'react'
import { Upload, FileText, X, Check, AlertTriangle, Loader2, User, Mail, MapPin, Calendar, Award, Code, Briefcase, GraduationCap } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { resumeParser, ParsedResume } from '../lib/resumeParser'
import { securityManager } from '../lib/security'
import { supabase } from '../lib/supabase'

interface ResumeUploadProps {
  onResumeUploaded?: (resume: ParsedResume) => void
  onClose?: () => void
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({ onResumeUploaded, onClose }) => {
  const { user, trackEvent } = useAuth()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    setError(null)
    setUploadedFile(file)
    
    // Validate file
    const validation = securityManager.validateFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    // Upload file to storage
    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    if (!user) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/resume-${Date.now()}.${fileExt}`

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (uploadError) {
        console.error('Error uploading resume:', uploadError)
        setError(`Failed to upload resume: ${uploadError.message}`)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      // Parse the resume
      await parseResume(file, publicUrl)

      await trackEvent('resume_uploaded', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })

    } catch (error) {
      console.error('Error uploading resume:', error)
      setError('Failed to upload resume')
    } finally {
      setUploading(false)
    }
  }

  const parseResume = async (file: File, fileUrl: string) => {
    setParsing(true)
    setError(null)

    try {
      const parsed = await resumeParser.parseResume(file)
      setParsedResume(parsed)

      // Save parsed resume data to database
      await saveResumeData(parsed, fileUrl)

      await trackEvent('resume_parsed', {
        fileName: file.name,
        confidence: parsed.metadata.confidence,
        warnings: parsed.metadata.warnings.length
      })

      onResumeUploaded?.(parsed)

    } catch (error) {
      console.error('Error parsing resume:', error)
      setError(error instanceof Error ? error.message : 'Failed to parse resume')
    } finally {
      setParsing(false)
    }
  }

  const saveResumeData = async (resume: ParsedResume, fileUrl: string) => {
    if (!user) return

    try {
      // Save to resumes table
      const { error } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          file_url: fileUrl,
          file_name: resume.metadata.fileName,
          file_type: resume.metadata.fileType,
          parsed_data: resume,
          confidence_score: resume.metadata.confidence,
          warnings: resume.metadata.warnings,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving resume data:', error)
      }

      // Update user profile with resume data
      const profileUpdates: any = {}
      
      if (resume.personalInfo.name && !user.user_metadata?.full_name) {
        profileUpdates.full_name = resume.personalInfo.name
      }
      
      if (resume.personalInfo.location) {
        profileUpdates.location = resume.personalInfo.location
      }
      
      if (resume.personalInfo.linkedin) {
        profileUpdates.linkedin_url = resume.personalInfo.linkedin
      }
      
      if (resume.personalInfo.github) {
        profileUpdates.github_url = resume.personalInfo.github
      }
      
      if (resume.personalInfo.website) {
        profileUpdates.website = resume.personalInfo.website
      }
      
      if (resume.skills.technical.length > 0) {
        const allSkills = [
          ...resume.skills.technical,
          ...resume.skills.frameworks,
          ...resume.skills.tools,
          ...resume.skills.languages
        ]
        profileUpdates.skills = [...new Set(allSkills)]
      }
      
      if (resume.experience.length > 0) {
        // Calculate years of experience
        const totalYears = resume.experience.reduce((total, exp) => {
          if (exp.startDate && exp.endDate) {
            const start = new Date(exp.startDate)
            const end = exp.endDate === 'Present' ? new Date() : new Date(exp.endDate)
            const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365)
            return total + years
          }
          return total
        }, 0)
        
        if (totalYears > 0) {
          profileUpdates.years_experience = Math.round(totalYears)
        }
      }

      if (Object.keys(profileUpdates).length > 0) {
        profileUpdates.updated_at = new Date().toISOString()
        
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user.id)

        if (profileError) {
          console.error('Error updating profile:', profileError)
        }
      }

    } catch (error) {
      console.error('Error saving resume data:', error)
    }
  }

  const resetUpload = () => {
    setUploadedFile(null)
    setParsedResume(null)
    setError(null)
    setUploadProgress(0)
    setUploading(false)
    setParsing(false)
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'text-green-400'
    if (confidence >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Upload className="w-6 h-6 text-teal-400" />
            <h3 className="text-xl font-bold text-white">Resume Upload & Parser</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
        <p className="text-gray-300 text-sm mt-2">
          Upload your resume to automatically extract and populate your profile information
        </p>
      </div>

      <div className="p-6">
        {!uploadedFile ? (
          /* Upload Area */
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-teal-400 bg-teal-500/10'
                : 'border-white/20 hover:border-white/40'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">
              Drop your resume here or click to browse
            </h4>
            <p className="text-gray-400 text-sm mb-4">
              Supports PDF, DOC, DOCX, and TXT files up to 10MB
            </p>
            
            <label className="inline-block">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileInput}
                className="hidden"
              />
              <span className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 cursor-pointer">
                Choose File
              </span>
            </label>

            <div className="mt-6 text-xs text-gray-400">
              <p className="mb-2">Supported formats:</p>
              <div className="flex justify-center space-x-4">
                <span className="flex items-center space-x-1">
                  <FileText className="w-3 h-3" />
                  <span>PDF</span>
                </span>
                <span className="flex items-center space-x-1">
                  <FileText className="w-3 h-3" />
                  <span>DOC</span>
                </span>
                <span className="flex items-center space-x-1">
                  <FileText className="w-3 h-3" />
                  <span>DOCX</span>
                </span>
                <span className="flex items-center space-x-1">
                  <FileText className="w-3 h-3" />
                  <span>TXT</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Upload Progress & Results */
          <div className="space-y-6">
            {/* File Info */}
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-teal-400" />
                  <div>
                    <h4 className="font-semibold text-white">{uploadedFile.name}</h4>
                    <p className="text-gray-400 text-sm">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetUpload}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-300">Uploading...</span>
                    <span className="text-sm text-gray-300">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Parsing Progress */}
              {parsing && (
                <div className="mt-4 flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 text-teal-400 animate-spin" />
                  <span className="text-sm text-gray-300">Parsing resume content...</span>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-400 mb-1">Upload Error</h4>
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Parsed Resume Display */}
            {parsedResume && (
              <div className="space-y-6">
                {/* Parsing Summary */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white">Parsing Results</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">Confidence:</span>
                      <span className={`font-bold ${getConfidenceColor(parsedResume.metadata.confidence)}`}>
                        {parsedResume.metadata.confidence}%
                      </span>
                    </div>
                  </div>

                  {parsedResume.metadata.warnings.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-yellow-400 mb-2">Warnings:</h5>
                      <ul className="space-y-1">
                        {parsedResume.metadata.warnings.map((warning, index) => (
                          <li key={index} className="text-xs text-yellow-300 flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-teal-400">
                        {parsedResume.experience.length}
                      </div>
                      <div className="text-gray-400">Experience</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-400">
                        {parsedResume.education.length}
                      </div>
                      <div className="text-gray-400">Education</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-400">
                        {parsedResume.skills.technical.length + parsedResume.skills.frameworks.length + parsedResume.skills.tools.length}
                      </div>
                      <div className="text-gray-400">Skills</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">
                        {parsedResume.projects.length}
                      </div>
                      <div className="text-gray-400">Projects</div>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                {parsedResume.personalInfo && Object.keys(parsedResume.personalInfo).length > 0 && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>Personal Information</span>
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      {parsedResume.personalInfo.name && (
                        <div>
                          <span className="text-gray-400">Name:</span>
                          <span className="text-white ml-2">{parsedResume.personalInfo.name}</span>
                        </div>
                      )}
                      {parsedResume.personalInfo.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="text-white">{parsedResume.personalInfo.email}</span>
                        </div>
                      )}
                      {parsedResume.personalInfo.phone && (
                        <div>
                          <span className="text-gray-400">Phone:</span>
                          <span className="text-white ml-2">{parsedResume.personalInfo.phone}</span>
                        </div>
                      )}
                      {parsedResume.personalInfo.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="text-white">{parsedResume.personalInfo.location}</span>
                        </div>
                      )}
                      {parsedResume.personalInfo.linkedin && (
                        <div>
                          <span className="text-gray-400">LinkedIn:</span>
                          <a href={parsedResume.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-teal-400 ml-2 hover:text-teal-300">
                            View Profile
                          </a>
                        </div>
                      )}
                      {parsedResume.personalInfo.github && (
                        <div>
                          <span className="text-gray-400">GitHub:</span>
                          <a href={parsedResume.personalInfo.github} target="_blank" rel="noopener noreferrer" className="text-teal-400 ml-2 hover:text-teal-300">
                            View Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {parsedResume.experience.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                      <Briefcase className="w-4 h-4" />
                      <span>Work Experience</span>
                    </h4>
                    <div className="space-y-3">
                      {parsedResume.experience.slice(0, 3).map((exp, index) => (
                        <div key={index} className="border-l-2 border-teal-400 pl-4">
                          <h5 className="font-medium text-white">{exp.position}</h5>
                          {exp.company && <p className="text-teal-400 text-sm">{exp.company}</p>}
                          {(exp.startDate || exp.endDate) && (
                            <p className="text-gray-400 text-xs flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{exp.startDate} - {exp.endDate || 'Present'}</span>
                            </p>
                          )}
                          {exp.description && (
                            <p className="text-gray-300 text-sm mt-1 line-clamp-2">{exp.description}</p>
                          )}
                          {exp.technologies && exp.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {exp.technologies.slice(0, 5).map((tech, techIndex) => (
                                <span key={techIndex} className="px-2 py-1 bg-teal-500/20 text-teal-400 rounded text-xs">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {parsedResume.experience.length > 3 && (
                        <p className="text-gray-400 text-sm">
                          +{parsedResume.experience.length - 3} more experience entries
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Education */}
                {parsedResume.education.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>Education</span>
                    </h4>
                    <div className="space-y-2">
                      {parsedResume.education.map((edu, index) => (
                        <div key={index}>
                          <h5 className="font-medium text-white">{edu.degree}</h5>
                          {edu.field && <p className="text-teal-400 text-sm">{edu.field}</p>}
                          {edu.institution && <p className="text-gray-300 text-sm">{edu.institution}</p>}
                          {edu.graduationDate && (
                            <p className="text-gray-400 text-xs">{edu.graduationDate}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {(parsedResume.skills.technical.length > 0 || parsedResume.skills.frameworks.length > 0 || parsedResume.skills.tools.length > 0) && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                      <Code className="w-4 h-4" />
                      <span>Technical Skills</span>
                    </h4>
                    <div className="space-y-3">
                      {parsedResume.skills.languages.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Programming Languages</h5>
                          <div className="flex flex-wrap gap-1">
                            {parsedResume.skills.languages.map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {parsedResume.skills.frameworks.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Frameworks</h5>
                          <div className="flex flex-wrap gap-1">
                            {parsedResume.skills.frameworks.map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {parsedResume.skills.tools.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Tools</h5>
                          <div className="flex flex-wrap gap-1">
                            {parsedResume.skills.tools.map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {parsedResume.skills.technical.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-300 mb-2">Other Technical Skills</h5>
                          <div className="flex flex-wrap gap-1">
                            {parsedResume.skills.technical.map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-teal-500/20 text-teal-400 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {parsedResume.projects.length > 0 && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                      <Award className="w-4 h-4" />
                      <span>Projects</span>
                    </h4>
                    <div className="space-y-2">
                      {parsedResume.projects.slice(0, 3).map((project, index) => (
                        <div key={index}>
                          <h5 className="font-medium text-white">{project.name}</h5>
                          {project.description && (
                            <p className="text-gray-300 text-sm line-clamp-2">{project.description}</p>
                          )}
                          {project.technologies && project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {project.technologies.slice(0, 5).map((tech, techIndex) => (
                                <span key={techIndex} className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Message */}
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-green-400 mb-1">Resume Processed Successfully</h4>
                      <p className="text-green-300 text-sm">
                        Your resume has been parsed and your profile has been updated with the extracted information.
                        You can review and edit the details in your profile settings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}