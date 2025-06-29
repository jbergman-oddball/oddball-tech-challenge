import React, { useState, useEffect } from 'react'
import { Mail, Send, Users, Calendar, Clock, Copy, Check, Trash2, Edit3, Plus, Loader2 } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

interface Challenge {
  id: string
  title: string
  description: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  time_limit: number
  category: string
}

interface Invitation {
  id: string
  email: string
  role: 'interviewer' | 'candidate'
  challenge_id?: string
  status: 'pending' | 'accepted' | 'expired'
  expires_at: string
  created_by: string
  created_at: string
  challenge?: Challenge
}

export const InvitationManager: React.FC = () => {
  const { user, userRole, trackEvent } = useAuth()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [sending, setSending] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Invitation form state
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'candidate' as 'interviewer' | 'candidate',
    challengeId: '',
    expiresIn: 7 // days
  })

  useEffect(() => {
    if (userRole === 'interviewer') {
      fetchInvitations()
      fetchChallenges()
    }
  }, [userRole])

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          challenge:challenges(id, title, description, difficulty, time_limit, category)
        `)
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching invitations:', error)
        return
      }

      setInvitations(data || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('id, title, description, difficulty, time_limit, category')
        .eq('status', 'active')
        .order('title')

      if (error) {
        console.error('Error fetching challenges:', error)
        return
      }

      setChallenges(data || [])
    } catch (error) {
      console.error('Error fetching challenges:', error)
    }
  }

  const sendInvitation = async () => {
    if (!inviteForm.email || !user) return

    setSending(true)
    try {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + inviteForm.expiresIn)

      const invitationData = {
        email: inviteForm.email,
        role: inviteForm.role,
        challenge_id: inviteForm.challengeId || null,
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
        status: 'pending'
      }

      const { data, error } = await supabase
        .from('invitations')
        .insert(invitationData)
        .select(`
          *,
          challenge:challenges(id, title, description, difficulty, time_limit, category)
        `)
        .single()

      if (error) {
        console.error('Error sending invitation:', error)
        return
      }

      // Add to local state
      setInvitations(prev => [data, ...prev])

      // Track event
      await trackEvent('invitation_sent', {
        email: inviteForm.email,
        role: inviteForm.role,
        challengeId: inviteForm.challengeId
      })

      // Reset form
      setInviteForm({
        email: '',
        role: 'candidate',
        challengeId: '',
        expiresIn: 7
      })
      setShowInviteForm(false)

      // In a real app, you would send an email here
      alert(`Invitation sent to ${inviteForm.email}! (In production, this would send an email)`)

    } catch (error) {
      console.error('Error sending invitation:', error)
    } finally {
      setSending(false)
    }
  }

  const deleteInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId)

      if (!error) {
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
        await trackEvent('invitation_deleted', { invitationId })
      }
    } catch (error) {
      console.error('Error deleting invitation:', error)
    }
  }

  const copyInvitationLink = async (invitationId: string) => {
    const link = `${window.location.origin}/invite/${invitationId}`
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(invitationId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Error copying link:', error)
    }
  }

  // Handle tile clicks for navigation and filtering
  const handleTileClick = (action: string) => {
    // For now, these tiles don't have specific filtering actions
    // but they could be enhanced to filter invitations by status
    console.log('Tile clicked:', action)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400'
      case 'accepted': return 'bg-green-500/20 text-green-400'
      case 'expired': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/20 text-green-400'
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-400'
      case 'Advanced': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (userRole !== 'interviewer') {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <Mail className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Access Restricted</h3>
          <p className="text-gray-300">Only interviewers can manage invitations.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Loading invitations...</p>
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
            <Mail className="w-6 h-6 text-teal-400" />
            <h2 className="text-xl font-bold text-white">User Invitations</h2>
          </div>
          <button
            onClick={() => setShowInviteForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg text-white hover:from-teal-600 hover:to-cyan-600 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Send Invitation</span>
          </button>
        </div>
      </div>

      {/* Invitation Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Send Invitation</h3>
              <button
                onClick={() => setShowInviteForm(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="candidate@example.com"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Role
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setInviteForm(prev => ({ ...prev, role: 'candidate' }))}
                    className={`flex-1 py-2 rounded-lg font-medium transition-all duration-200 ${
                      inviteForm.role === 'candidate'
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    Candidate
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteForm(prev => ({ ...prev, role: 'interviewer' }))}
                    className={`flex-1 py-2 rounded-lg font-medium transition-all duration-200 ${
                      inviteForm.role === 'interviewer'
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    Interviewer
                  </button>
                </div>
              </div>

              {inviteForm.role === 'candidate' && (
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Challenge (Optional)
                  </label>
                  <select
                    value={inviteForm.challengeId}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, challengeId: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="" className="bg-gray-800">No specific challenge</option>
                    {challenges.map(challenge => (
                      <option key={challenge.id} value={challenge.id} className="bg-gray-800">
                        {challenge.title} ({challenge.difficulty})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Expires In
                </label>
                <select
                  value={inviteForm.expiresIn}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, expiresIn: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value={1} className="bg-gray-800">1 day</option>
                  <option value={3} className="bg-gray-800">3 days</option>
                  <option value={7} className="bg-gray-800">1 week</option>
                  <option value={14} className="bg-gray-800">2 weeks</option>
                  <option value={30} className="bg-gray-800">1 month</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowInviteForm(false)}
                className="flex-1 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendInvitation}
                disabled={sending || !inviteForm.email}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Invitation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invitations List */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-bold text-white mb-4">Sent Invitations</h3>
        
        {invitations.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No invitations sent yet</p>
            <button
              onClick={() => setShowInviteForm(true)}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg text-white hover:from-teal-600 hover:to-cyan-600 transition-all duration-200"
            >
              Send Your First Invitation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map(invitation => (
              <div key={invitation.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-white">{invitation.email}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                        {invitation.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invitation.role === 'interviewer' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {invitation.role}
                      </span>
                    </div>

                    {invitation.challenge && (
                      <div className="mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-300 text-sm">Challenge:</span>
                          <span className="text-white text-sm font-medium">{invitation.challenge.title}</span>
                          <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(invitation.challenge.difficulty)}`}>
                            {invitation.challenge.difficulty}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">{invitation.challenge.description}</p>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Sent: {new Date(invitation.created_at).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Expires: {new Date(invitation.expires_at).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => copyInvitationLink(invitation.id)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Copy invitation link"
                    >
                      {copiedId === invitation.id ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteInvitation(invitation.id)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      title="Delete invitation"
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

      {/* Statistics - Now Clickable */}
      <div className="grid md:grid-cols-3 gap-4">
        <button
          onClick={() => handleTileClick('total-sent')}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 text-left group"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-white group-hover:text-teal-400 transition-colors">
              {invitations.length}
            </div>
            <div className="text-gray-400 text-sm">Total Sent</div>
          </div>
        </button>
        
        <button
          onClick={() => handleTileClick('accepted')}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 text-left group"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 group-hover:text-green-300 transition-colors">
              {invitations.filter(inv => inv.status === 'accepted').length}
            </div>
            <div className="text-gray-400 text-sm">Accepted</div>
          </div>
        </button>
        
        <button
          onClick={() => handleTileClick('pending')}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 text-left group"
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors">
              {invitations.filter(inv => inv.status === 'pending').length}
            </div>
            <div className="text-gray-400 text-sm">Pending</div>
          </div>
        </button>
      </div>
    </div>
  )
}