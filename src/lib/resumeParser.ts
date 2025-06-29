// Resume Parser with Enterprise Features
import { securityManager } from './security'

export interface ParsedResume {
  personalInfo: {
    name?: string
    email?: string
    phone?: string
    location?: string
    linkedin?: string
    github?: string
    website?: string
  }
  summary?: string
  experience: Array<{
    company: string
    position: string
    startDate?: string
    endDate?: string
    description: string
    technologies?: string[]
  }>
  education: Array<{
    institution: string
    degree: string
    field?: string
    graduationDate?: string
    gpa?: string
  }>
  skills: {
    technical: string[]
    soft: string[]
    languages: string[]
    frameworks: string[]
    tools: string[]
  }
  projects: Array<{
    name: string
    description: string
    technologies?: string[]
    url?: string
  }>
  certifications: Array<{
    name: string
    issuer: string
    date?: string
    expiryDate?: string
  }>
  metadata: {
    parseDate: string
    fileType: string
    fileName: string
    confidence: number
    warnings: string[]
  }
}

export class ResumeParser {
  private static instance: ResumeParser
  
  // Common technology keywords for better parsing
  private techKeywords = [
    // Programming Languages
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
    // Frontend
    'react', 'vue', 'angular', 'html', 'css', 'sass', 'less', 'tailwind', 'bootstrap', 'jquery',
    // Backend
    'node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'asp.net',
    // Databases
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'sqlite', 'oracle',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github actions',
    // Tools
    'git', 'webpack', 'vite', 'babel', 'eslint', 'prettier', 'jest', 'cypress'
  ]

  private softSkills = [
    'leadership', 'communication', 'teamwork', 'problem solving', 'analytical thinking',
    'project management', 'agile', 'scrum', 'mentoring', 'collaboration'
  ]

  static getInstance(): ResumeParser {
    if (!ResumeParser.instance) {
      ResumeParser.instance = new ResumeParser()
    }
    return ResumeParser.instance
  }

  async parseResume(file: File): Promise<ParsedResume> {
    // Security validation
    const validation = securityManager.validateFile(file)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const fileType = this.getFileType(file.name)
    let text = ''

    try {
      switch (fileType) {
        case 'pdf':
          text = await this.parsePDF(file)
          break
        case 'docx':
          text = await this.parseDocx(file)
          break
        case 'doc':
          text = await this.parseDoc(file)
          break
        case 'txt':
          text = await this.parseText(file)
          break
        default:
          throw new Error(`Unsupported file type: ${fileType}`)
      }

      const parsed = this.parseTextContent(text)
      parsed.metadata = {
        parseDate: new Date().toISOString(),
        fileType,
        fileName: file.name,
        confidence: this.calculateConfidence(parsed),
        warnings: this.generateWarnings(parsed, text)
      }

      return parsed
    } catch (error) {
      console.error('Resume parsing error:', error)
      throw new Error(`Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase()
    return extension || 'unknown'
  }

  private async parsePDF(file: File): Promise<string> {
    // For PDF parsing, we'll use a simple text extraction
    // In a real enterprise environment, you'd use a proper PDF parsing library
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          // This is a simplified approach - in production, use pdf-parse or similar
          const text = reader.result as string
          resolve(this.extractTextFromPDF(text))
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read PDF file'))
      reader.readAsText(file)
    })
  }

  private extractTextFromPDF(content: string): string {
    // Simplified PDF text extraction
    // In production, use proper PDF parsing libraries
    return content.replace(/[^\x20-\x7E\n]/g, ' ').trim()
  }

  private async parseDocx(file: File): Promise<string> {
    // For DOCX parsing, we'll extract text content
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer
          const text = await this.extractTextFromDocx(arrayBuffer)
          resolve(text)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read DOCX file'))
      reader.readAsArrayBuffer(file)
    })
  }

  private async extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
    // Simplified DOCX text extraction
    // In production, use mammoth.js or similar
    const decoder = new TextDecoder()
    const text = decoder.decode(arrayBuffer)
    return text.replace(/[^\x20-\x7E\n]/g, ' ').trim()
  }

  private async parseDoc(file: File): Promise<string> {
    // Legacy DOC format - simplified extraction
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const text = reader.result as string
          resolve(text.replace(/[^\x20-\x7E\n]/g, ' ').trim())
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read DOC file'))
      reader.readAsText(file)
    })
  }

  private async parseText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read text file'))
      reader.readAsText(file)
    })
  }

  private parseTextContent(text: string): ParsedResume {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    const resume: ParsedResume = {
      personalInfo: {},
      experience: [],
      education: [],
      skills: {
        technical: [],
        soft: [],
        languages: [],
        frameworks: [],
        tools: []
      },
      projects: [],
      certifications: [],
      metadata: {
        parseDate: '',
        fileType: '',
        fileName: '',
        confidence: 0,
        warnings: []
      }
    }

    // Parse personal information
    resume.personalInfo = this.extractPersonalInfo(text)
    
    // Parse sections
    const sections = this.identifySections(lines)
    
    // Extract experience
    if (sections.experience.length > 0) {
      resume.experience = this.extractExperience(sections.experience)
    }
    
    // Extract education
    if (sections.education.length > 0) {
      resume.education = this.extractEducation(sections.education)
    }
    
    // Extract skills
    resume.skills = this.extractSkills(text)
    
    // Extract projects
    if (sections.projects.length > 0) {
      resume.projects = this.extractProjects(sections.projects)
    }
    
    // Extract certifications
    if (sections.certifications.length > 0) {
      resume.certifications = this.extractCertifications(sections.certifications)
    }
    
    // Extract summary
    if (sections.summary.length > 0) {
      resume.summary = sections.summary.join(' ').trim()
    }

    return resume
  }

  private extractPersonalInfo(text: string): ParsedResume['personalInfo'] {
    const info: ParsedResume['personalInfo'] = {}
    
    // Extract email
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
    if (emailMatch) {
      info.email = emailMatch[0]
    }
    
    // Extract phone
    const phoneMatch = text.match(/(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/)
    if (phoneMatch) {
      info.phone = phoneMatch[0]
    }
    
    // Extract LinkedIn
    const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/)
    if (linkedinMatch) {
      info.linkedin = `https://${linkedinMatch[0]}`
    }
    
    // Extract GitHub
    const githubMatch = text.match(/github\.com\/[\w-]+/)
    if (githubMatch) {
      info.github = `https://${githubMatch[0]}`
    }
    
    // Extract website
    const websiteMatch = text.match(/https?:\/\/[\w.-]+\.[a-z]{2,}/)
    if (websiteMatch && !websiteMatch[0].includes('linkedin') && !websiteMatch[0].includes('github')) {
      info.website = websiteMatch[0]
    }
    
    // Extract name (first few words that look like a name)
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    for (const line of lines.slice(0, 5)) {
      if (this.looksLikeName(line)) {
        info.name = line
        break
      }
    }

    return info
  }

  private looksLikeName(text: string): boolean {
    // Simple heuristic to identify names
    const words = text.split(/\s+/)
    if (words.length < 2 || words.length > 4) return false
    
    // Check if all words start with capital letter and contain only letters
    return words.every(word => 
      /^[A-Z][a-z]+$/.test(word) && 
      word.length > 1 && 
      word.length < 20
    )
  }

  private identifySections(lines: string[]): {
    experience: string[]
    education: string[]
    skills: string[]
    projects: string[]
    certifications: string[]
    summary: string[]
  } {
    const sections = {
      experience: [] as string[],
      education: [] as string[],
      skills: [] as string[],
      projects: [] as string[],
      certifications: [] as string[],
      summary: [] as string[]
    }

    let currentSection = 'summary'
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase()
      
      // Identify section headers
      if (this.isExperienceHeader(lowerLine)) {
        currentSection = 'experience'
        continue
      } else if (this.isEducationHeader(lowerLine)) {
        currentSection = 'education'
        continue
      } else if (this.isSkillsHeader(lowerLine)) {
        currentSection = 'skills'
        continue
      } else if (this.isProjectsHeader(lowerLine)) {
        currentSection = 'projects'
        continue
      } else if (this.isCertificationsHeader(lowerLine)) {
        currentSection = 'certifications'
        continue
      }
      
      // Add content to current section
      if (currentSection === 'experience') {
        sections.experience.push(line)
      } else if (currentSection === 'education') {
        sections.education.push(line)
      } else if (currentSection === 'skills') {
        sections.skills.push(line)
      } else if (currentSection === 'projects') {
        sections.projects.push(line)
      } else if (currentSection === 'certifications') {
        sections.certifications.push(line)
      } else {
        sections.summary.push(line)
      }
    }

    return sections
  }

  private isExperienceHeader(line: string): boolean {
    const experienceKeywords = ['experience', 'work experience', 'employment', 'career', 'professional experience']
    return experienceKeywords.some(keyword => line.includes(keyword))
  }

  private isEducationHeader(line: string): boolean {
    const educationKeywords = ['education', 'academic', 'university', 'college', 'degree']
    return educationKeywords.some(keyword => line.includes(keyword))
  }

  private isSkillsHeader(line: string): boolean {
    const skillsKeywords = ['skills', 'technical skills', 'competencies', 'technologies']
    return skillsKeywords.some(keyword => line.includes(keyword))
  }

  private isProjectsHeader(line: string): boolean {
    const projectsKeywords = ['projects', 'portfolio', 'personal projects']
    return projectsKeywords.some(keyword => line.includes(keyword))
  }

  private isCertificationsHeader(line: string): boolean {
    const certKeywords = ['certifications', 'certificates', 'credentials', 'licenses']
    return certKeywords.some(keyword => line.includes(keyword))
  }

  private extractExperience(lines: string[]): ParsedResume['experience'] {
    const experiences: ParsedResume['experience'] = []
    let currentExp: Partial<ParsedResume['experience'][0]> = {}
    
    for (const line of lines) {
      // Check if this looks like a job title/company line
      if (this.looksLikeJobTitle(line)) {
        if (currentExp.company || currentExp.position) {
          experiences.push(currentExp as ParsedResume['experience'][0])
        }
        currentExp = this.parseJobTitleLine(line)
      } else if (this.looksLikeDate(line)) {
        const dates = this.extractDates(line)
        if (dates.start) currentExp.startDate = dates.start
        if (dates.end) currentExp.endDate = dates.end
      } else if (line.length > 20) {
        // Likely a description
        currentExp.description = (currentExp.description || '') + ' ' + line
        
        // Extract technologies from description
        const techs = this.extractTechnologies(line)
        if (techs.length > 0) {
          currentExp.technologies = [...(currentExp.technologies || []), ...techs]
        }
      }
    }
    
    if (currentExp.company || currentExp.position) {
      experiences.push(currentExp as ParsedResume['experience'][0])
    }
    
    return experiences
  }

  private looksLikeJobTitle(line: string): boolean {
    // Heuristics to identify job title lines
    const jobTitleKeywords = ['engineer', 'developer', 'manager', 'analyst', 'consultant', 'specialist', 'lead', 'senior', 'junior']
    const hasJobKeyword = jobTitleKeywords.some(keyword => line.toLowerCase().includes(keyword))
    const hasAtSymbol = line.includes(' at ') || line.includes(' @ ')
    const reasonableLength = line.length > 10 && line.length < 100
    
    return (hasJobKeyword || hasAtSymbol) && reasonableLength
  }

  private parseJobTitleLine(line: string): Partial<ParsedResume['experience'][0]> {
    const parts = line.split(/\s+at\s+|\s+@\s+/i)
    if (parts.length >= 2) {
      return {
        position: parts[0].trim(),
        company: parts[1].trim()
      }
    }
    
    // Fallback: assume first part is position
    return {
      position: line.trim(),
      company: ''
    }
  }

  private looksLikeDate(line: string): boolean {
    const datePatterns = [
      /\d{4}\s*-\s*\d{4}/,
      /\d{1,2}\/\d{4}\s*-\s*\d{1,2}\/\d{4}/,
      /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
      /present|current|ongoing/i
    ]
    
    return datePatterns.some(pattern => pattern.test(line))
  }

  private extractDates(line: string): { start?: string; end?: string } {
    const dates: { start?: string; end?: string } = {}
    
    // Try to extract year ranges
    const yearRange = line.match(/(\d{4})\s*-\s*(\d{4}|present|current)/i)
    if (yearRange) {
      dates.start = yearRange[1]
      dates.end = yearRange[2].toLowerCase() === 'present' || yearRange[2].toLowerCase() === 'current' ? 'Present' : yearRange[2]
    }
    
    return dates
  }

  private extractEducation(lines: string[]): ParsedResume['education'] {
    const education: ParsedResume['education'] = []
    let currentEd: Partial<ParsedResume['education'][0]> = {}
    
    for (const line of lines) {
      if (this.looksLikeDegree(line)) {
        if (currentEd.institution || currentEd.degree) {
          education.push(currentEd as ParsedResume['education'][0])
        }
        currentEd = this.parseDegree(line)
      } else if (this.looksLikeInstitution(line)) {
        currentEd.institution = line.trim()
      } else if (this.looksLikeDate(line)) {
        const dates = this.extractDates(line)
        if (dates.end) currentEd.graduationDate = dates.end
      }
    }
    
    if (currentEd.institution || currentEd.degree) {
      education.push(currentEd as ParsedResume['education'][0])
    }
    
    return education
  }

  private looksLikeDegree(line: string): boolean {
    const degreeKeywords = ['bachelor', 'master', 'phd', 'doctorate', 'associate', 'b.s.', 'm.s.', 'b.a.', 'm.a.', 'degree']
    return degreeKeywords.some(keyword => line.toLowerCase().includes(keyword))
  }

  private looksLikeInstitution(line: string): boolean {
    const institutionKeywords = ['university', 'college', 'institute', 'school']
    return institutionKeywords.some(keyword => line.toLowerCase().includes(keyword))
  }

  private parseDegree(line: string): Partial<ParsedResume['education'][0]> {
    // Extract degree and field
    const parts = line.split(/\sin\s/i)
    return {
      degree: parts[0].trim(),
      field: parts[1]?.trim()
    }
  }

  private extractSkills(text: string): ParsedResume['skills'] {
    const skills: ParsedResume['skills'] = {
      technical: [],
      soft: [],
      languages: [],
      frameworks: [],
      tools: []
    }
    
    const lowerText = text.toLowerCase()
    
    // Extract technical skills
    for (const tech of this.techKeywords) {
      if (lowerText.includes(tech.toLowerCase())) {
        if (this.isFramework(tech)) {
          skills.frameworks.push(tech)
        } else if (this.isTool(tech)) {
          skills.tools.push(tech)
        } else if (this.isProgrammingLanguage(tech)) {
          skills.languages.push(tech)
        } else {
          skills.technical.push(tech)
        }
      }
    }
    
    // Extract soft skills
    for (const soft of this.softSkills) {
      if (lowerText.includes(soft.toLowerCase())) {
        skills.soft.push(soft)
      }
    }
    
    // Remove duplicates
    skills.technical = [...new Set(skills.technical)]
    skills.soft = [...new Set(skills.soft)]
    skills.languages = [...new Set(skills.languages)]
    skills.frameworks = [...new Set(skills.frameworks)]
    skills.tools = [...new Set(skills.tools)]
    
    return skills
  }

  private isFramework(tech: string): boolean {
    const frameworks = ['react', 'vue', 'angular', 'express', 'django', 'flask', 'spring', 'laravel', 'rails']
    return frameworks.includes(tech.toLowerCase())
  }

  private isTool(tech: string): boolean {
    const tools = ['git', 'docker', 'kubernetes', 'jenkins', 'webpack', 'vite', 'babel']
    return tools.includes(tech.toLowerCase())
  }

  private isProgrammingLanguage(tech: string): boolean {
    const languages = ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin']
    return languages.includes(tech.toLowerCase())
  }

  private extractTechnologies(text: string): string[] {
    const technologies: string[] = []
    const lowerText = text.toLowerCase()
    
    for (const tech of this.techKeywords) {
      if (lowerText.includes(tech.toLowerCase())) {
        technologies.push(tech)
      }
    }
    
    return [...new Set(technologies)]
  }

  private extractProjects(lines: string[]): ParsedResume['projects'] {
    const projects: ParsedResume['projects'] = []
    let currentProject: Partial<ParsedResume['projects'][0]> = {}
    
    for (const line of lines) {
      if (this.looksLikeProjectTitle(line)) {
        if (currentProject.name) {
          projects.push(currentProject as ParsedResume['projects'][0])
        }
        currentProject = { name: line.trim() }
      } else if (line.length > 20) {
        currentProject.description = (currentProject.description || '') + ' ' + line
        
        const techs = this.extractTechnologies(line)
        if (techs.length > 0) {
          currentProject.technologies = [...(currentProject.technologies || []), ...techs]
        }
      }
    }
    
    if (currentProject.name) {
      projects.push(currentProject as ParsedResume['projects'][0])
    }
    
    return projects
  }

  private looksLikeProjectTitle(line: string): boolean {
    // Simple heuristic for project titles
    return line.length > 5 && line.length < 50 && !line.includes('.')
  }

  private extractCertifications(lines: string[]): ParsedResume['certifications'] {
    const certifications: ParsedResume['certifications'] = []
    
    for (const line of lines) {
      if (line.length > 10) {
        const cert = this.parseCertification(line)
        if (cert) {
          certifications.push(cert)
        }
      }
    }
    
    return certifications
  }

  private parseCertification(line: string): ParsedResume['certifications'][0] | null {
    // Try to extract certification name and issuer
    const parts = line.split(/\s+by\s+|\s+from\s+/i)
    if (parts.length >= 2) {
      return {
        name: parts[0].trim(),
        issuer: parts[1].trim()
      }
    }
    
    return {
      name: line.trim(),
      issuer: ''
    }
  }

  private calculateConfidence(resume: ParsedResume): number {
    let score = 0
    let maxScore = 0
    
    // Personal info scoring
    maxScore += 30
    if (resume.personalInfo.name) score += 10
    if (resume.personalInfo.email) score += 10
    if (resume.personalInfo.phone) score += 5
    if (resume.personalInfo.linkedin || resume.personalInfo.github) score += 5
    
    // Experience scoring
    maxScore += 40
    if (resume.experience.length > 0) {
      score += 20
      if (resume.experience.some(exp => exp.company && exp.position)) score += 10
      if (resume.experience.some(exp => exp.description && exp.description.length > 50)) score += 10
    }
    
    // Education scoring
    maxScore += 15
    if (resume.education.length > 0) {
      score += 10
      if (resume.education.some(edu => edu.institution && edu.degree)) score += 5
    }
    
    // Skills scoring
    maxScore += 15
    if (resume.skills.technical.length > 0 || resume.skills.languages.length > 0) {
      score += 15
    }
    
    return Math.round((score / maxScore) * 100)
  }

  private generateWarnings(resume: ParsedResume, originalText: string): string[] {
    const warnings: string[] = []
    
    if (!resume.personalInfo.email) {
      warnings.push('No email address found')
    }
    
    if (resume.experience.length === 0) {
      warnings.push('No work experience found')
    }
    
    if (resume.education.length === 0) {
      warnings.push('No education information found')
    }
    
    if (resume.skills.technical.length === 0 && resume.skills.languages.length === 0) {
      warnings.push('No technical skills identified')
    }
    
    if (originalText.length < 500) {
      warnings.push('Resume content appears to be very short')
    }
    
    return warnings
  }
}

export const resumeParser = ResumeParser.getInstance()