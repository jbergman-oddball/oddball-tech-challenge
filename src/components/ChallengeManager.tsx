import React, { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, Eye, Code, Target, Clock, Award, Save, X, Copy, Check, Filter, Search, Loader2, Video } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { VideoCallModal } from './VideoCallModal'

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  points: number
  time_limit: number
  category: string
  starter_code: string | null
  test_cases: string[]
  created_by: string
  created_at: string
  updated_at: string
  status: 'draft' | 'active' | 'archived'
  enable_video_interview: boolean
  video_interview_persona?: string
}

export const ChallengeManager: React.FC = () => {
  const { user, userRole, trackEvent } = useAuth()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [selectedChallengeForVideo, setSelectedChallengeForVideo] = useState<Challenge | null>(null)

  // Challenge form state
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
    difficulty: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    points: 50,
    time_limit: 60,
    category: '',
    starter_code: '',
    test_cases: [''],
    status: 'draft' as 'draft' | 'active' | 'archived',
    enable_video_interview: false,
    video_interview_persona: ''
  })

  // Predefined categories
  const categories = [
    'Frontend Development',
    'Backend Development',
    'Full Stack Development',
    'DevOps',
    'Data Structures & Algorithms',
    'System Design',
    'Database Design',
    'API Development',
    'Testing',
    'Security',
    'Performance Optimization',
    'Containerization',
    'Cloud Computing',
    'Scripting',
    'Mobile Development'
  ]

  useEffect(() => {
    if (userRole === 'interviewer') {
      fetchChallenges()
    }
  }, [userRole])

  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching challenges:', error)
        return
      }

      setChallenges(data || [])
    } catch (error) {
      console.error('Error fetching challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setChallengeForm({
      title: '',
      description: '',
      difficulty: 'Beginner',
      points: 50,
      time_limit: 60,
      category: '',
      starter_code: '',
      test_cases: [''],
      status: 'draft',
      enable_video_interview: false,
      video_interview_persona: ''
    })
  }

  const openCreateModal = () => {
    resetForm()
    setEditingChallenge(null)
    setShowCreateModal(true)
  }

  const openEditModal = (challenge: Challenge) => {
    setChallengeForm({
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      points: challenge.points,
      time_limit: challenge.time_limit,
      category: challenge.category,
      starter_code: challenge.starter_code || '',
      test_cases: challenge.test_cases.length > 0 ? challenge.test_cases : [''],
      status: challenge.status,
      enable_video_interview: challenge.enable_video_interview || false,
      video_interview_persona: challenge.video_interview_persona || ''
    })
    setEditingChallenge(challenge)
    setShowCreateModal(true)
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingChallenge(null)
    resetForm()
  }

  const addTestCase = () => {
    setChallengeForm(prev => ({
      ...prev,
      test_cases: [...prev.test_cases, '']
    }))
  }

  const removeTestCase = (index: number) => {
    setChallengeForm(prev => ({
      ...prev,
      test_cases: prev.test_cases.filter((_, i) => i !== index)
    }))
  }

  const updateTestCase = (index: number, value: string) => {
    setChallengeForm(prev => ({
      ...prev,
      test_cases: prev.test_cases.map((tc, i) => i === index ? value : tc)
    }))
  }

  const saveChallenge = async () => {
    if (!challengeForm.title || !challengeForm.description || !challengeForm.category) {
      alert('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const challengeData = {
        title: challengeForm.title,
        description: challengeForm.description,
        difficulty: challengeForm.difficulty,
        points: challengeForm.points,
        time_limit: challengeForm.time_limit,
        category: challengeForm.category,
        starter_code: challengeForm.starter_code || null,
        test_cases: challengeForm.test_cases.filter(tc => tc.trim() !== ''),
        status: challengeForm.status,
        enable_video_interview: challengeForm.enable_video_interview,
        video_interview_persona: challengeForm.video_interview_persona || null,
        created_by: user?.id,
        updated_at: new Date().toISOString()
      }

      if (editingChallenge) {
        // Update existing challenge
        const { data, error } = await supabase
          .from('challenges')
          .update(challengeData)
          .eq('id', editingChallenge.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating challenge:', error)
          return
        }

        setChallenges(prev => prev.map(c => c.id === editingChallenge.id ? data : c))
        await trackEvent('challenge_updated', { challengeId: editingChallenge.id, title: challengeForm.title })
      } else {
        // Create new challenge
        const { data, error } = await supabase
          .from('challenges')
          .insert(challengeData)
          .select()
          .single()

        if (error) {
          console.error('Error creating challenge:', error)
          return
        }

        setChallenges(prev => [data, ...prev])
        await trackEvent('challenge_created', { challengeId: data.id, title: challengeForm.title })
      }

      closeModal()
    } catch (error) {
      console.error('Error saving challenge:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteChallenge = async (challengeId: string) => {
    if (!confirm('Are you sure you want to delete this challenge? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challengeId)

      if (!error) {
        setChallenges(prev => prev.filter(c => c.id !== challengeId))
        await trackEvent('challenge_deleted', { challengeId })
      }
    } catch (error) {
      console.error('Error deleting challenge:', error)
    }
  }

  const duplicateChallenge = async (challenge: Challenge) => {
    const duplicatedChallenge = {
      title: `${challenge.title} (Copy)`,
      description: challenge.description,
      difficulty: challenge.difficulty,
      points: challenge.points,
      time_limit: challenge.time_limit,
      category: challenge.category,
      starter_code: challenge.starter_code,
      test_cases: challenge.test_cases,
      status: 'draft' as const,
      enable_video_interview: challenge.enable_video_interview || false,
      video_interview_persona: challenge.video_interview_persona,
      created_by: user?.id
    }

    try {
      const { data, error } = await supabase
        .from('challenges')
        .insert(duplicatedChallenge)
        .select()
        .single()

      if (!error) {
        setChallenges(prev => [data, ...prev])
        await trackEvent('challenge_duplicated', { originalId: challenge.id, newId: data.id })
      }
    } catch (error) {
      console.error('Error duplicating challenge:', error)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const openVideoCall = (challenge: Challenge) => {
    setSelectedChallengeForVideo(challenge)
    setShowVideoModal(true)
  }

  // Handle tile clicks for navigation and filtering
  const handleTileClick = (action: string) => {
    switch (action) {
      case 'total-challenges':
        setStatusFilter('all')
        setDifficultyFilter('all')
        setCategoryFilter('all')
        setSearchTerm('')
        break
      case 'active-challenges':
        setStatusFilter('active')
        break
      case 'draft-challenges':
        setStatusFilter('draft')
        break
      case 'categories':
        // Could open a category filter modal or similar
        break
    }
  }

  const filteredChallenges = challenges.filter(challenge => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || challenge.category === categoryFilter
    const matchesDifficulty = difficultyFilter === 'all' || challenge.difficulty === difficultyFilter
    const matchesStatus = statusFilter === 'all' || challenge.status === statusFilter
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/20 text-green-400'
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-400'
      case 'Advanced': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400'
      case 'draft': return 'bg-yellow-500/20 text-yellow-400'
      case 'archived': return 'bg-gray-500/20 text-gray-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (userRole !== 'interviewer') {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <Code className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Access Restricted</h3>
          <p className="text-gray-300">Only interviewers can create and manage challenges.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Loading challenges...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code className="w-6 h-6 text-teal-400" />
            <h2 className="text-xl font-bold text-white">Challenge Management</h2>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg text-white hover:from-teal-600 hover:to-cyan-600 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Create Challenge</span>
          </button>
        </div>
      </div>

      {/* Stats - Now Clickable */}
      <div className="grid md:grid-cols-4 gap-4">
        <button
          onClick={() => handleTileClick('total-challenges')}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 text-left group"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-white group-hover:text-teal-400 transition-colors">
              {challenges.length}
            </div>
            <div className="text-gray-400 text-sm">Total Challenges</div>
          </div>
        </button>
        
        <button
          onClick={() => handleTileClick('active-challenges')}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 text-left group"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 group-hover:text-green-300 transition-colors">
              {challenges.filter(c => c.status === 'active').length}
            </div>
            <div className="text-gray-400 text-sm">Active</div>
          </div>
        </button>
        
        <button
          onClick={() => handleTileClick('draft-challenges')}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 text-left group"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors">
              {challenges.filter(c => c.status === 'draft').length}
            </div>
            <div className="text-gray-400 text-sm">Drafts</div>
          </div>
        </button>
        
        <button
          onClick={() => handleTileClick('categories')}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 text-left group"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400 group-hover:text-purple-300 transition-colors">
              {challenges.filter(c => c.enable_video_interview).length}
            </div>
            <div className="text-gray-400 text-sm">With Video AI</div>
          </div>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="grid md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search challenges..."
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all" className="bg-gray-800">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category} className="bg-gray-800">{category}</option>
            ))}
          </select>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all" className="bg-gray-800">All Difficulties</option>
            <option value="Beginner" className="bg-gray-800">Beginner</option>
            <option value="Intermediate" className="bg-gray-800">Intermediate</option>
            <option value="Advanced" className="bg-gray-800">Advanced</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all" className="bg-gray-800">All Status</option>
            <option value="active" className="bg-gray-800">Active</option>
            <option value="draft" className="bg-gray-800">Draft</option>
            <option value="archived" className="bg-gray-800">Archived</option>
          </select>
          <div className="text-white text-sm flex items-center">
            {filteredChallenges.length} of {challenges.length} challenges
          </div>
        </div>
      </div>

      {/* Challenges List */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        {filteredChallenges.length === 0 ? (
          <div className="text-center py-8">
            <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">
              {challenges.length === 0 ? 'No challenges created yet' : 'No challenges match your filters'}
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg text-white hover:from-teal-600 hover:to-cyan-600 transition-all duration-200"
            >
              Create Your First Challenge
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChallenges.map(challenge => (
              <div key={challenge.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{challenge.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                        {challenge.difficulty}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(challenge.status)}`}>
                        {challenge.status}
                      </span>
                      {challenge.enable_video_interview && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium flex items-center space-x-1">
                          <Video className="w-3 h-3" />
                          <span>AI Interview</span>
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">{challenge.description}</p>
                    
                    <div className="flex items-center space-x-6 text-xs text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Target className="w-3 h-3" />
                        <span>{challenge.category}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Award className="w-3 h-3" />
                        <span>{challenge.points} points</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{challenge.time_limit} minutes</span>
                      </span>
                      <span>{challenge.test_cases.length} test cases</span>
                      <span>Created: {new Date(challenge.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {challenge.enable_video_interview && (
                      <button
                        onClick={() => openVideoCall(challenge)}
                        className="p-2 text-purple-400 hover:text-purple-300 transition-colors"
                        title="Start AI video interview"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => copyToClipboard(challenge.id, challenge.id)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Copy challenge ID"
                    >
                      {copiedId === challenge.id ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => duplicateChallenge(challenge)}
                      className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                      title="Duplicate challenge"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(challenge)}
                      className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"
                      title="Edit challenge"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteChallenge(challenge.id)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      title="Delete challenge"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">
                {editingChallenge ? 'Edit Challenge' : 'Create New Challenge'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Challenge Title *
                  </label>
                  <input
                    type="text"
                    value={challengeForm.title}
                    onChange={(e) => setChallengeForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter challenge title"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Description *
                  </label>
                  <textarea
                    value={challengeForm.description}
                    onChange={(e) => setChallengeForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Describe the challenge requirements, what the candidate needs to implement, and any specific instructions..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Difficulty
                    </label>
                    <select
                      value={challengeForm.difficulty}
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, difficulty: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="Beginner" className="bg-gray-800">Beginner</option>
                      <option value="Intermediate" className="bg-gray-800">Intermediate</option>
                      <option value="Advanced" className="bg-gray-800">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Status
                    </label>
                    <select
                      value={challengeForm.status}
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="draft" className="bg-gray-800">Draft</option>
                      <option value="active" className="bg-gray-800">Active</option>
                      <option value="archived" className="bg-gray-800">Archived</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      value={challengeForm.points}
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                      min="1"
                      max="500"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Time Limit (minutes)
                    </label>
                    <input
                      type="number"
                      value={challengeForm.time_limit}
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, time_limit: parseInt(e.target.value) || 0 }))}
                      min="15"
                      max="240"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Category *
                  </label>
                  <select
                    value={challengeForm.category}
                    onChange={(e) => setChallengeForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="" className="bg-gray-800">Select a category</option>
                    {categories.map(category => (
                      <option key={category} value={category} className="bg-gray-800">{category}</option>
                    ))}
                  </select>
                </div>

                {/* Video Interview Settings */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <input
                      type="checkbox"
                      id="enableVideoInterview"
                      checked={challengeForm.enable_video_interview}
                      onChange={(e) => setChallengeForm(prev => ({ ...prev, enable_video_interview: e.target.checked }))}
                      className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="enableVideoInterview" className="text-white font-medium flex items-center space-x-2">
                      <Video className="w-4 h-4 text-purple-400" />
                      <span>Enable AI Video Interview</span>
                    </label>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Allow candidates to have an AI-powered video conversation with a Tavus.io persona during this challenge.
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Starter Code (Optional)
                  </label>
                  <textarea
                    value={challengeForm.starter_code}
                    onChange={(e) => setChallengeForm(prev => ({ ...prev, starter_code: e.target.value }))}
                    rows={8}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-sm"
                    placeholder="// Provide starter code template for candidates
function solutionFunction() {
  // Your implementation here
  return result;
}"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-white text-sm font-medium">
                      Test Cases / Requirements
                    </label>
                    <button
                      onClick={addTestCase}
                      className="flex items-center space-x-1 px-3 py-1 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors text-sm"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {challengeForm.test_cases.map((testCase, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={testCase}
                          onChange={(e) => updateTestCase(index, e.target.value)}
                          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                          placeholder={`Test case ${index + 1} or requirement description`}
                        />
                        {challengeForm.test_cases.length > 1 && (
                          <button
                            onClick={() => removeTestCase(index)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    Add test cases, requirements, or evaluation criteria that candidates should meet
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button
                onClick={closeModal}
                className="flex-1 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveChallenge}
                disabled={saving || !challengeForm.title || !challengeForm.description || !challengeForm.category}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{editingChallenge ? 'Update Challenge' : 'Create Challenge'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        challengeId={selectedChallengeForVideo?.id}
        challengeTitle={selectedChallengeForVideo?.title}
        challengeDescription={selectedChallengeForVideo?.description}
      />
    </div>
  )
}