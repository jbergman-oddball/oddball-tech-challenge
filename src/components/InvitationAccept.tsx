import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { Mail, Clock, User, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface InvitationData {
  id: string
  email: string
  role: 'interviewer' | 'candidate'
  challenge_id?: string
  status: string
  expires_at: string
  created_by: string
  challenge?: {
    id: string
    title: string
    description: string
    difficulty: string
    time_limit: number
    category: string
  }
  inviter?: {
    full_name: string
    email: string
  }
}

interface InvitationAcceptProps {
  invitationId: string
  onAccepted?: () => void
}

export const InvitationAccept: React.FC<InvitationAcceptProps> = ({ 
  invitationId, 
  onAccepted 
}) => {
  const { user, signUp, signIn, trackEvent } = useAuth()
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    fullName: ''
  })

  useEffect(() => {
    fetchInvitation()
  }, [invitationId])

  const fetchInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          challenge:challenges(id, title, description, difficulty, time_limit, category),
          inviter:profiles!invitations_created_by_fkey(full_name, email)
        `)
        .eq('id', invitationId)
        .single()

      if (error) {
        setError('Invitation not found or has expired')
        return
      }

      // Check if invitation is expired
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired')
        return
      }

      // Check if invitation is already accepted
      if (data.status !== 'pending') {
        setError('This invitation has already been used')
        return
      }

      setInvitation(data)
      setAuthForm(prev => ({ ...prev, email: data.email }))
    } catch (error) {
      console.error('Error fetching invitation:', error)
      setError('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const acceptInvitation = async () => {
    if (!invitation) return

    setAccepting(true)
    setError(null)

    try {
      let authResult

      if (isSignUp) {
        // Create new account
        authResult = await signUp(
          authForm.email, 
          authForm.password, 
          invitation.role, 
          authForm.fullName
        )
      } else {
        // Sign in existing user
        authResult = await signIn(authForm.email, authForm.password)
      }

      if (authResult.error) {
        setError(authResult.error.message)
        return
      }

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitationId)

      if (updateError) {
        console.error('Error updating invitation status:', updateError)
      }

      // If there's a challenge assigned, create a session
      if (invitation.challenge_id && invitation.role === 'candidate') {
        const { error: sessionError } = await supabase
          .from('sessions')
          .insert({
            candidate_name: authForm.fullName || authForm.email,
            candidate_email: authForm.email,
            challenge_id: invitation.challenge_id,
            created_by: invitation.created_by,
            status: 'pending'
          })

        if (sessionError) {
          console.error('Error creating session:', sessionError)
        }
      }

      // Track event
      await trackEvent('invitation_accepted', {
        invitationId,
        role: invitation.role,
        challengeId: invitation.challenge_id
      })

      onAccepted?.()

    } catch (error) {
      console.error('Error accepting invitation:', error)
      setError('Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-teal-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-teal-900 to-cyan-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Invalid Invitation</h1>
            <p className="text-gray-300 mb-6">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!invitation) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-teal-900 to-cyan-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 p-2">
              <img 
                src="/oddball-ball-vector.png" 
                alt="Oddball's Tech Challenge Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">You're Invited!</h1>
            <p className="text-gray-300">
              {invitation.inviter?.full_name || invitation.inviter?.email} has invited you to join Oddball's Tech Challenge
            </p>
          </div>

          {/* Invitation Details */}
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-teal-400" />
                <span className="text-gray-300 text-sm">Role:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  invitation.role === 'interviewer' 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {invitation.role}
                </span>
              </div>

              {invitation.challenge && (
                <div className="flex items-start space-x-2">
                  <div className="w-4 h-4 bg-white rounded flex items-center justify-center mt-0.5 p-0.5">
                    <img 
                      src="/oddball-ball-vector.png" 
                      alt="Challenge" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="text-gray-300 text-sm">Challenge:</span>
                    <div className="text-white font-medium">{invitation.challenge.title}</div>
                    <div className="text-gray-400 text-xs">{invitation.challenge.description}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded text-xs ${
                        invitation.challenge.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                        invitation.challenge.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {invitation.challenge.difficulty}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {invitation.challenge.time_limit} minutes
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-teal-400" />
                <span className="text-gray-300 text-sm">Expires:</span>
                <span className="text-white text-sm">
                  {new Date(invitation.expires_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Authentication Form */}
          <form onSubmit={(e) => { e.preventDefault(); acceptInvitation(); }} className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
                disabled
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={authForm.fullName}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder={isSignUp ? "Create a password" : "Enter your password"}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={accepting}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {accepting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>{isSignUp ? 'Create Account & Accept' : 'Sign In & Accept'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-teal-400 hover:text-teal-300 transition-colors text-sm"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}