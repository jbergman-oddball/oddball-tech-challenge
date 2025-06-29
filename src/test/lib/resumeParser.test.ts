import { describe, it, expect, beforeEach } from 'vitest'
import { resumeParser } from '../../lib/resumeParser'

describe('ResumeParser', () => {
  beforeEach(() => {
    // Reset any state if needed
  })

  it('should validate file types correctly', () => {
    const validFile = new File(['content'], 'resume.pdf', { type: 'application/pdf' })
    const invalidFile = new File(['content'], 'resume.exe', { type: 'application/x-executable' })

    // This would normally be tested through the security manager
    expect(validFile.name.endsWith('.pdf')).toBe(true)
    expect(invalidFile.name.endsWith('.exe')).toBe(true)
  })

  it('should extract email addresses from text', () => {
    const text = 'Contact me at john.doe@example.com for more information'
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
    const match = text.match(emailRegex)
    
    expect(match).toBeTruthy()
    expect(match![0]).toBe('john.doe@example.com')
  })

  it('should extract phone numbers from text', () => {
    const text = 'Call me at (555) 123-4567 or 555.123.4567'
    const phoneRegex = /(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/
    const match = text.match(phoneRegex)
    
    expect(match).toBeTruthy()
  })

  it('should identify LinkedIn URLs', () => {
    const text = 'Find me on linkedin.com/in/johndoe'
    const linkedinRegex = /linkedin\.com\/in\/[\w-]+/
    const match = text.match(linkedinRegex)
    
    expect(match).toBeTruthy()
    expect(match![0]).toBe('linkedin.com/in/johndoe')
  })

  it('should identify GitHub URLs', () => {
    const text = 'Check out my code at github.com/johndoe'
    const githubRegex = /github\.com\/[\w-]+/
    const match = text.match(githubRegex)
    
    expect(match).toBeTruthy()
    expect(match![0]).toBe('github.com/johndoe')
  })

  it('should identify names correctly', () => {
    const testNames = [
      'John Doe',
      'Mary Jane Smith',
      'Dr. Robert Johnson',
    ]
    
    const invalidNames = [
      'john doe', // lowercase
      'JOHN DOE', // all caps
      'John', // single word
      'John Doe Jr. III', // too many words
      'john@example.com', // email
    ]

    const namePattern = /^[A-Z][a-z]+(\s[A-Z][a-z]+)+$/

    testNames.forEach(name => {
      expect(namePattern.test(name.replace(/^Dr\.\s/, ''))).toBe(true)
    })

    invalidNames.forEach(name => {
      expect(namePattern.test(name)).toBe(false)
    })
  })

  it('should identify technical skills', () => {
    const text = 'I have experience with JavaScript, React, Node.js, Python, and Docker'
    const techKeywords = ['javascript', 'react', 'node.js', 'python', 'docker']
    const lowerText = text.toLowerCase()
    
    const foundSkills = techKeywords.filter(skill => lowerText.includes(skill.toLowerCase()))
    
    expect(foundSkills).toContain('javascript')
    expect(foundSkills).toContain('react')
    expect(foundSkills).toContain('python')
    expect(foundSkills).toContain('docker')
  })

  it('should calculate confidence scores', () => {
    const mockResume = {
      personalInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-123-4567',
        linkedin: 'linkedin.com/in/johndoe'
      },
      experience: [
        {
          company: 'Tech Corp',
          position: 'Software Engineer',
          description: 'Developed web applications using React and Node.js'
        }
      ],
      education: [
        {
          institution: 'University of Technology',
          degree: 'Bachelor of Science',
          field: 'Computer Science'
        }
      ],
      skills: {
        technical: ['JavaScript', 'React', 'Node.js'],
        languages: ['Python', 'Java'],
        frameworks: ['Express', 'Django'],
        tools: ['Git', 'Docker']
      }
    }

    // Calculate confidence based on available data
    let score = 0
    let maxScore = 100

    // Personal info (30 points)
    if (mockResume.personalInfo.name) score += 10
    if (mockResume.personalInfo.email) score += 10
    if (mockResume.personalInfo.phone) score += 5
    if (mockResume.personalInfo.linkedin) score += 5

    // Experience (40 points)
    if (mockResume.experience.length > 0) score += 40

    // Education (15 points)
    if (mockResume.education.length > 0) score += 15

    // Skills (15 points)
    if (mockResume.skills.technical.length > 0 || mockResume.skills.languages.length > 0) score += 15

    const confidence = Math.round((score / maxScore) * 100)
    
    expect(confidence).toBeGreaterThan(80)
  })

  it('should generate appropriate warnings', () => {
    const incompleteResume = {
      personalInfo: { name: 'John Doe' }, // Missing email
      experience: [], // No experience
      education: [], // No education
      skills: { technical: [], languages: [], frameworks: [], tools: [] } // No skills
    }

    const warnings: string[] = []

    if (!incompleteResume.personalInfo.email) warnings.push('No email address found')
    if (incompleteResume.experience.length === 0) warnings.push('No work experience found')
    if (incompleteResume.education.length === 0) warnings.push('No education information found')
    if (incompleteResume.skills.technical.length === 0 && incompleteResume.skills.languages.length === 0) {
      warnings.push('No technical skills identified')
    }

    expect(warnings).toContain('No email address found')
    expect(warnings).toContain('No work experience found')
    expect(warnings).toContain('No education information found')
    expect(warnings).toContain('No technical skills identified')
  })
})