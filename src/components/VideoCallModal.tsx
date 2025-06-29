import React, { useState, useEffect } from 'react'
import { Video, X, Users, Clock, MessageSquare, Star, Play, Loader2, AlertTriangle, CheckCircle, Phone, PhoneOff } from 'lucide-react'
import { tavusManager, TavusPersona, TavusCallConfig } from '../lib/tavus'
import { useAuth } from '../auth/AuthProvider'

interface VideoCallModalProps {
  isOpen: boolean
  onClose: () => void
  challengeId?: string
  challengeTitle?: string
  challengeDescription?: string
  sessionId?: string
  candidateName?: string
  candidateEmail?: string
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  challengeId,
  challengeTitle,
  challengeDescription,
  sessionId,
  candidateName,
  candidateEmail
}) => {
  const { user, trackEvent } = useAuth()
  const [personas, setPersonas] = useState<TavusPersona[]>([])
  const [selectedPersona, setSelectedPersona] = useState<TavusPersona | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [callUrl, setCallUrl] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [callStatus, setCallStatus] = useState<'setup' | 'connecting' | 'active' | 'ended'>('setup')

  useEffect(() => {
    if (isOpen) {
      fetchPersonas()
    }
  }, [isOpen])

  const fetchPersonas = async () => {
    try {
      setLoading(true)
      const availablePersonas = await tavusManager.getPersonas()
      setPersonas(availablePersonas.filter(p => p.is_active))
      
      // Auto-select first persona if available
      if (availablePersonas.length > 0) {
        setSelectedPersona(availablePersonas[0])
      }
    } catch (error) {
      console.error('Error fetching personas:', error)
      setError('Failed to load AI interviewers')
    } finally {
      setLoading(false)
    }
  }

  const startVideoCall = async () => {
    if (!selectedPersona || !user) return

    setCreating(true)
    setError(null)

    try {
      const config: TavusCallConfig = {
        persona_id: selectedPersona.id,
        participant_name: candidateName || user.user_metadata?.full_name || user.email || 'Candidate',
        participant_email: candidateEmail || user.email || '',
        session_context: {
          challenge_title: challengeTitle,
          challenge_description: challengeDescription,
          interview_focus: selectedPersona.expertise_areas
        },
        call_settings: {
          max_duration_minutes: 45,
          auto_record: true,
          enable_screen_share: true,
          conversation_starters: [
            `Hi! I'm ${selectedPersona.name}, and I'll be conducting your technical interview today.`,
            `Let's start by discussing the challenge: ${challengeTitle}`,
            "Feel free to share your screen if you'd like to walk through any code or diagrams.",
            "I'm here to help you showcase your technical skills. Let's begin!"
          ]
        }
      }

      const result = await tavusManager.createVideoCall(config)
      setCallUrl(result.call_url)
      setConversationId(result.conversation_id)
      setCallStatus('connecting')

      // Track the video call initiation
      await trackEvent('video_call_started', {
        persona_id: selectedPersona.id,
        challenge_id: challengeId,
        session_id: sessionId,
        conversation_id: result.conversation_id
      })

      // Simulate call connection (in real implementation, this would be handled by Tavus)
      setTimeout(() => {
        setCallStatus('active')
      }, 2000)

    } catch (error) {
      console.error('Error starting video call:', error)
      setError('Failed to start video call. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const endCall = async () => {
    if (conversationId) {
      await tavusManager.updateConversationStatus(conversationId, 'completed', {
        end_time: new Date().toISOString()
      })

      await trackEvent('video_call_ended', {
        conversation_id: conversationId,
        duration_status: callStatus
      })
    }

    setCallStatus('ended')
    setTimeout(() => {
      handleClose()
    }, 3000)
  }

  const handleClose = () => {
    setCallUrl(null)
    setConversationId(null)
    setCallStatus('setup')
    setSelectedPersona(null)
    setError(null)
    onClose()
  }

  const getPersonalityColor = (style: string) => {
    switch (style) {
      case 'professional': return 'bg-blue-500/20 text-blue-400'
      case 'friendly': return 'bg-green-500/20 text-green-400'
      case 'technical': return 'bg-purple-500/20 text-purple-400'
      case 'casual': return 'bg-orange-500/20 text-orange-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Video className="w-6 h-6 text-teal-400" />
              <div>
                <h3 className="text-xl font-bold text-white">AI Video Interview</h3>
                <p className="text-gray-300 text-sm">
                  {challengeTitle ? `Challenge: ${challengeTitle}` : 'Technical Interview Session'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Setup Phase */}
          {callStatus === 'setup' && (
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
                  <p className="text-white">Loading AI interviewers...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-white mb-2">Error</h4>
                  <p className="text-red-300 mb-4">{error}</p>
                  <button
                    onClick={fetchPersonas}
                    className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg text-white hover:from-teal-600 hover:to-cyan-600 transition-all duration-200"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-4">Choose Your AI Interviewer</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {personas.map(persona => (
                        <div
                          key={persona.id}
                          onClick={() => setSelectedPersona(persona)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                            selectedPersona?.id === persona.id
                              ? 'border-teal-400 bg-teal-500/10'
                              : 'border-white/20 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-white/10">
                              {persona.avatar_url ? (
                                <img
                                  src={persona.avatar_url}
                                  alt={persona.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Users className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-white mb-1">{persona.name}</h5>
                              <p className="text-gray-300 text-sm mb-2">{persona.description}</p>
                              
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`px-2 py-1 rounded text-xs ${getPersonalityColor(persona.conversation_style)}`}>
                                  {persona.conversation_style}
                                </span>
                              </div>
                              
                              <div className="flex flex-wrap gap-1">
                                {persona.expertise_areas.slice(0, 3).map(area => (
                                  <span key={area} className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded text-xs">
                                    {area}
                                  </span>
                                ))}
                                {persona.expertise_areas.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded text-xs">
                                    +{persona.expertise_areas.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedPersona && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <h5 className="font-semibold text-white mb-3">Interview Details</h5>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Interviewer:</span>
                          <span className="text-white ml-2">{selectedPersona.name}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Style:</span>
                          <span className="text-white ml-2 capitalize">{selectedPersona.conversation_style}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Duration:</span>
                          <span className="text-white ml-2">Up to 45 minutes</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Recording:</span>
                          <span className="text-white ml-2">Enabled for review</span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <span className="text-gray-400 text-sm">Focus Areas:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedPersona.expertise_areas.map(area => (
                            <span key={area} className="px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full text-sm">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={startVideoCall}
                      disabled={!selectedPersona || creating}
                      className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {creating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          <span>Start Interview</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Connecting Phase */}
          {callStatus === 'connecting' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Video className="w-10 h-10 text-teal-400 animate-pulse" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Connecting to {selectedPersona?.name}...</h4>
              <p className="text-gray-300 mb-6">
                Setting up your AI-powered technical interview session
              </p>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}

          {/* Active Call Phase */}
          {callStatus === 'active' && callUrl && (
            <div className="space-y-6">
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">Connected to {selectedPersona?.name}</span>
                </div>
              </div>

              {/* Video Call Interface */}
              <div className="bg-black/20 rounded-lg p-8 text-center">
                <div className="w-24 h-24 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-12 h-12 text-teal-400" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Video Interview in Progress</h4>
                <p className="text-gray-300 mb-6">
                  Your interview with {selectedPersona?.name} is now active
                </p>
                
                {/* Mock video interface */}
                <div className="bg-white/5 rounded-lg p-6 mb-6">
                  <p className="text-gray-300 text-sm mb-4">
                    In a real implementation, this would show the Tavus.io video interface
                  </p>
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex items-center space-x-2 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm">Recording</span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">15:30</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => window.open(callUrl, '_blank')}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg text-white hover:from-teal-600 hover:to-cyan-600 transition-all duration-200"
                  >
                    <Video className="w-5 h-5" />
                    <span>Open Video Call</span>
                  </button>
                  <button
                    onClick={endCall}
                    className="flex items-center space-x-2 px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    <PhoneOff className="w-5 h-5" />
                    <span>End Call</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Call Ended Phase */}
          {callStatus === 'ended' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">Interview Completed</h4>
              <p className="text-gray-300 mb-6">
                Thank you for participating in the AI-powered technical interview
              </p>
              <p className="text-gray-400 text-sm">
                The interview recording and analysis will be available to the hiring team
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}