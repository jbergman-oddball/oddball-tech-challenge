import React, { useState } from 'react'
import { Wand2, Send, Loader2, CheckCircle, AlertTriangle, Code, Target, Clock, Award, Sparkles } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

interface GeneratedChallenge {
  title: string
  description: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  points: number
  time_limit: number
  category: string
  starter_code: string
  test_cases: string[]
}

export const ChallengeCreator: React.FC = () => {
  const { user, userRole, trackEvent } = useAuth()
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedChallenge, setGeneratedChallenge] = useState<GeneratedChallenge | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const generateChallenge = async () => {
    if (!prompt.trim()) {
      setError('Please provide information about the challenge you want to create')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      // Simulate AI challenge generation (in production, this would call an AI service)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Parse the prompt to extract challenge details
      const challenge = parsePromptToChallenge(prompt)
      setGeneratedChallenge(challenge)

      await trackEvent('challenge_generated', { promptLength: prompt.length })
    } catch (error) {
      console.error('Error generating challenge:', error)
      setError('Failed to generate challenge. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const parsePromptToChallenge = (prompt: string): GeneratedChallenge => {
    const lowerPrompt = prompt.toLowerCase()
    
    // Determine difficulty based on keywords
    let difficulty: 'Beginner' | 'Intermediate' | 'Advanced' = 'Intermediate'
    if (lowerPrompt.includes('beginner') || lowerPrompt.includes('basic') || lowerPrompt.includes('simple')) {
      difficulty = 'Beginner'
    } else if (lowerPrompt.includes('advanced') || lowerPrompt.includes('complex') || lowerPrompt.includes('expert')) {
      difficulty = 'Advanced'
    }

    // Determine category based on keywords
    let category = 'Full Stack Development'
    if (lowerPrompt.includes('react') || lowerPrompt.includes('frontend') || lowerPrompt.includes('ui') || lowerPrompt.includes('component')) {
      category = 'Frontend Development'
    } else if (lowerPrompt.includes('api') || lowerPrompt.includes('backend') || lowerPrompt.includes('server') || lowerPrompt.includes('database')) {
      category = 'Backend Development'
    } else if (lowerPrompt.includes('devops') || lowerPrompt.includes('docker') || lowerPrompt.includes('kubernetes') || lowerPrompt.includes('deployment')) {
      category = 'DevOps'
    } else if (lowerPrompt.includes('algorithm') || lowerPrompt.includes('data structure') || lowerPrompt.includes('sorting') || lowerPrompt.includes('search')) {
      category = 'Data Structures & Algorithms'
    } else if (lowerPrompt.includes('python') || lowerPrompt.includes('javascript') || lowerPrompt.includes('java') || lowerPrompt.includes('programming')) {
      category = 'Backend Development'
    }

    // Generate points and time based on difficulty
    const pointsMap = { 'Beginner': 50, 'Intermediate': 100, 'Advanced': 150 }
    const timeMap = { 'Beginner': 45, 'Intermediate': 75, 'Advanced': 120 }

    // Generate title based on prompt content
    let title = 'Custom Challenge'
    if (lowerPrompt.includes('todo') || lowerPrompt.includes('task')) {
      title = 'Todo List Application'
    } else if (lowerPrompt.includes('api')) {
      title = 'REST API Development'
    } else if (lowerPrompt.includes('react')) {
      title = 'React Component Challenge'
    } else if (lowerPrompt.includes('algorithm')) {
      title = 'Algorithm Implementation'
    } else if (lowerPrompt.includes('database')) {
      title = 'Database Design Challenge'
    } else {
      // Extract potential title from first sentence
      const firstSentence = prompt.split('.')[0].trim()
      if (firstSentence.length < 50) {
        title = firstSentence
      }
    }

    // Generate description
    const description = `${prompt}\n\nImplement a solution that demonstrates your understanding of the requirements above. Focus on clean code, proper error handling, and following best practices for ${category.toLowerCase()}.`

    // Generate starter code based on category
    let starterCode = ''
    if (category === 'Frontend Development') {
      starterCode = `import React, { useState } from 'react';

function App() {
  // Add your state and logic here
  
  return (
    <div className="app">
      <h1>Challenge Solution</h1>
      {/* Implement your solution here */}
    </div>
  );
}

export default App;`
    } else if (category === 'Backend Development') {
      starterCode = `// Implement your solution here
function solution() {
  // Add your implementation
  
  return result;
}

// Example usage
console.log(solution());`
    } else if (category === 'DevOps') {
      starterCode = `# Add your configuration here
# Follow best practices for ${title.toLowerCase()}

version: '3.8'
services:
  app:
    # Configure your service
`
    } else {
      starterCode = `// Implement your solution here
function solution() {
  // Add your implementation based on the requirements
  
  return result;
}

module.exports = solution;`
    }

    // Generate test cases
    const testCases = [
      'Solution implements all required functionality',
      'Code follows best practices and is well-structured',
      'Error handling is implemented appropriately',
      'Solution is efficient and scalable',
      'Code is properly documented and readable'
    ]

    return {
      title,
      description,
      difficulty,
      points: pointsMap[difficulty],
      time_limit: timeMap[difficulty],
      category,
      starter_code: starterCode,
      test_cases: testCases
    }
  }

  const saveChallenge = async () => {
    if (!generatedChallenge || !user) return

    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('challenges')
        .insert({
          title: generatedChallenge.title,
          description: generatedChallenge.description,
          difficulty: generatedChallenge.difficulty,
          points: generatedChallenge.points,
          time_limit: generatedChallenge.time_limit,
          category: generatedChallenge.category,
          starter_code: generatedChallenge.starter_code,
          test_cases: generatedChallenge.test_cases,
          created_by: user.id,
          status: 'active'
        })

      if (error) {
        console.error('Error saving challenge:', error)
        setError('Failed to save challenge')
        return
      }

      setSuccess(true)
      await trackEvent('ai_challenge_saved', { 
        title: generatedChallenge.title,
        category: generatedChallenge.category,
        difficulty: generatedChallenge.difficulty
      })

      // Reset form after successful save
      setTimeout(() => {
        setPrompt('')
        setGeneratedChallenge(null)
        setSuccess(false)
      }, 3000)

    } catch (error) {
      console.error('Error saving challenge:', error)
      setError('Failed to save challenge')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setPrompt('')
    setGeneratedChallenge(null)
    setError(null)
    setSuccess(false)
  }

  if (userRole !== 'interviewer') {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <Wand2 className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Access Restricted</h3>
          <p className="text-gray-300">Only interviewers can create challenges.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Challenge Creator</h2>
            <p className="text-gray-300 text-sm">Describe your challenge idea and let AI generate a complete coding challenge</p>
          </div>
        </div>
      </div>

      {/* Challenge Prompt Input */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-bold text-white mb-4">Describe Your Challenge</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Challenge Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Describe the challenge you want to create. Include details like:
• What should the candidate build or implement?
• What technologies should they use?
• What difficulty level should it be?
• Any specific requirements or constraints?

Example: 'Create a React todo list component with add, delete, and mark complete functionality. Should be beginner-friendly and include proper state management.'"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-green-400 text-sm">Challenge created successfully!</p>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={generateChallenge}
              disabled={generating || !prompt.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Challenge...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  <span>Generate Challenge</span>
                </>
              )}
            </button>
            
            {generatedChallenge && (
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Generated Challenge Preview */}
      {generatedChallenge && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Generated Challenge</h3>
            <button
              onClick={saveChallenge}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{saving ? 'Saving...' : 'Save Challenge'}</span>
            </button>
          </div>

          <div className="space-y-6">
            {/* Challenge Header */}
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="text-xl font-bold text-white mb-3">{generatedChallenge.title}</h4>
              <div className="flex items-center space-x-4 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  generatedChallenge.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                  generatedChallenge.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {generatedChallenge.difficulty}
                </span>
                <span className="flex items-center space-x-1 text-gray-300">
                  <Target className="w-4 h-4" />
                  <span>{generatedChallenge.category}</span>
                </span>
                <span className="flex items-center space-x-1 text-gray-300">
                  <Award className="w-4 h-4" />
                  <span>{generatedChallenge.points} points</span>
                </span>
                <span className="flex items-center space-x-1 text-gray-300">
                  <Clock className="w-4 h-4" />
                  <span>{generatedChallenge.time_limit} minutes</span>
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{generatedChallenge.description}</p>
            </div>

            {/* Starter Code */}
            <div className="bg-white/5 rounded-lg p-4">
              <h5 className="font-semibold text-white mb-3 flex items-center space-x-2">
                <Code className="w-4 h-4" />
                <span>Starter Code</span>
              </h5>
              <div className="bg-black/20 rounded-lg p-4 overflow-x-auto">
                <pre className="text-gray-300 text-sm whitespace-pre-wrap">
                  {generatedChallenge.starter_code}
                </pre>
              </div>
            </div>

            {/* Test Cases */}
            <div className="bg-white/5 rounded-lg p-4">
              <h5 className="font-semibold text-white mb-3">Test Cases & Requirements</h5>
              <ul className="space-y-2">
                {generatedChallenge.test_cases.map((testCase, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{testCase}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}