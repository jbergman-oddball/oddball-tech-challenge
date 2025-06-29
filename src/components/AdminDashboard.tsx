import React, { useState, useEffect } from 'react'
import { Users, Shield, CheckCircle, XCircle, Clock, TrendingUp, Target, Award, Mail, Settings, Loader2, UserCheck, UserX, Eye, Crown, Edit3, Save, X } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

interface PendingUser {
  id: string
  email: string
  full_name: string | null
  role: 'pending'
  created_at: string
}

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'interviewer' | 'candidate' | 'pending'
  created_at: string
  updated_at: string
}

interface AdminStats {
  totalUsers: number
  pendingApprovals: number
  interviewers: number
  candidates: number
  totalSessions: number
  activeSessions: number
  completedSessions: number
  averageScore: number
}

export const AdminDashboard: React.FC = () => {
  const { user, userRole, updateUserRole, trackEvent } = useAuth()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [allUsers, setAllUsers] = useState<UserProfile[]>([])
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingApprovals: 0,
    interviewers: 0,
    candidates: 0,
    totalSessions: 0,
    activeSessions: 0,
    completedSessions: 0,
    averageScore: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'analytics'>('pending')
  const [processing, setProcessing] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [newRole, setNewRole] = useState<'interviewer' | 'candidate'>('candidate')

  useEffect(() => {
    if (userRole === 'interviewer') {
      fetchData()
    }
  }, [userRole])

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchPendingUsers(),
        fetchAllUsers(),
        fetchStats()
      ])
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'pending')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setPendingUsers(data)
    }
  }

  const fetchAllUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setAllUsers(data)
    }
  }

  const fetchStats = async () => {
    try {
      // Get user stats
      const { data: profiles } = await supabase
        .from('profiles')
        .select('role')

      // Get session stats
      const { data: sessions } = await supabase
        .from('sessions')
        .select('status, score')

      if (profiles) {
        const totalUsers = profiles.length
        const pendingApprovals = profiles.filter(p => p.role === 'pending').length
        const interviewers = profiles.filter(p => p.role === 'interviewer').length
        const candidates = profiles.filter(p => p.role === 'candidate').length

        let totalSessions = 0
        let activeSessions = 0
        let completedSessions = 0
        let totalScore = 0
        let scoredSessions = 0

        if (sessions) {
          totalSessions = sessions.length
          activeSessions = sessions.filter(s => s.status === 'in-progress').length
          completedSessions = sessions.filter(s => s.status === 'completed').length
          
          sessions.forEach(session => {
            if (session.score !== null) {
              totalScore += session.score
              scoredSessions++
            }
          })
        }

        const averageScore = scoredSessions > 0 ? Math.round(totalScore / scoredSessions) : 0

        setStats({
          totalUsers,
          pendingApprovals,
          interviewers,
          candidates,
          totalSessions,
          activeSessions,
          completedSessions,
          averageScore
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const approveUser = async (userId: string, role: 'interviewer' | 'candidate') => {
    setProcessing(userId)
    try {
      console.log(`Approving user ${userId} as ${role}`)
      
      const { error } = await updateUserRole(userId, role)
      
      if (!error) {
        // Update local state
        setPendingUsers(prev => prev.filter(u => u.id !== userId))
        setAllUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, role, updated_at: new Date().toISOString() } : u
        ))
        
        // Track the approval
        await trackEvent('user_approved', { userId, approvedRole: role, approvedBy: user?.id })
        
        // Refresh stats
        await fetchStats()
        
        // Show success message
        const userName = pendingUsers.find(u => u.id === userId)?.full_name || 'User'
        alert(`✅ ${userName} has been approved as ${role === 'interviewer' ? 'an Interviewer' : 'a Candidate'}!`)
        
        console.log(`Successfully approved user as ${role}`)
      } else {
        console.error('Error approving user:', error)
        alert(`❌ Failed to approve user: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error approving user:', error)
      alert(`❌ Failed to approve user: ${error}`)
    } finally {
      setProcessing(null)
    }
  }

  const rejectUser = async (userId: string) => {
    const userName = pendingUsers.find(u => u.id === userId)?.full_name || 'this user'
    
    if (!confirm(`Are you sure you want to reject ${userName}? This will delete their account permanently.`)) return

    setProcessing(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (!error) {
        setPendingUsers(prev => prev.filter(u => u.id !== userId))
        setAllUsers(prev => prev.filter(u => u.id !== userId))
        await trackEvent('user_rejected', { userId, rejectedBy: user?.id })
        await fetchStats() // Refresh stats
        alert(`❌ ${userName} has been rejected and their account deleted.`)
      } else {
        console.error('Error rejecting user:', error)
        alert(`❌ Failed to reject user: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error rejecting user:', error)
      alert(`❌ Failed to reject user: ${error}`)
    } finally {
      setProcessing(null)
    }
  }

  const startRoleEdit = (userId: string, currentRole: 'interviewer' | 'candidate') => {
    setEditingRole(userId)
    setNewRole(currentRole)
  }

  const cancelRoleEdit = () => {
    setEditingRole(null)
    setNewRole('candidate')
  }

  const saveRoleChange = async (userId: string) => {
    const userName = allUsers.find(u => u.id === userId)?.full_name || 'User'
    const currentRole = allUsers.find(u => u.id === userId)?.role
    
    if (currentRole === newRole) {
      cancelRoleEdit()
      return
    }

    if (!confirm(`Are you sure you want to change ${userName}'s role from ${currentRole} to ${newRole}?`)) {
      return
    }

    setProcessing(userId)
    try {
      const { error } = await updateUserRole(userId, newRole)
      
      if (!error) {
        setAllUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, role: newRole, updated_at: new Date().toISOString() } : u
        ))
        await trackEvent('admin_role_change', { userId, oldRole: currentRole, newRole, changedBy: user?.id })
        await fetchStats() // Refresh stats
        alert(`✅ ${userName}'s role has been changed from ${currentRole} to ${newRole}!`)
        setEditingRole(null)
      } else {
        console.error('Error changing user role:', error)
        alert(`❌ Failed to change role: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error changing user role:', error)
      alert(`❌ Failed to change role: ${error}`)
    } finally {
      setProcessing(null)
    }
  }

  // Handle tile clicks for navigation
  const handleTileClick = (action: string) => {
    switch (action) {
      case 'total-users':
        setActiveTab('users')
        break
      case 'pending-approvals':
        setActiveTab('pending')
        break
      case 'active-sessions':
        // Could navigate to sessions view if available
        break
      case 'average-score':
        setActiveTab('analytics')
        break
    }
  }

  if (userRole !== 'interviewer') {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Access Restricted</h3>
          <p className="text-gray-300">Only administrators can access this dashboard.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-teal-400" />
          <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
          {stats.pendingApprovals > 0 && (
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
              {stats.pendingApprovals} pending
            </span>
          )}
        </div>
      </div>

      {/* Stats Overview - Now Clickable */}
      <div className="grid md:grid-cols-4 gap-4">
        <button
          onClick={() => handleTileClick('total-users')}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 text-left group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white group-hover:text-teal-400 transition-colors">
                {stats.totalUsers}
              </p>
            </div>
            <Users className="w-8 h-8 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => handleTileClick('pending-approvals')}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 text-left group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Pending Approvals</p>
              <p className="text-2xl font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors">
                {stats.pendingApprovals}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400 group-hover:scale-110 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => handleTileClick('active-sessions')}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 text-left group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Active Sessions</p>
              <p className="text-2xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                {stats.activeSessions}
              </p>
            </div>
            <Target className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => handleTileClick('average-score')}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 text-left group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Avg Score</p>
              <p className="text-2xl font-bold text-green-400 group-hover:text-green-300 transition-colors">
                {stats.averageScore}%
              </p>
            </div>
            <Award className="w-8 h-8 text-green-400 group-hover:scale-110 transition-transform" />
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'pending'
                ? 'bg-teal-500/20 text-teal-400 border-b-2 border-teal-400'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Pending Approvals</span>
              {stats.pendingApprovals > 0 && (
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                  {stats.pendingApprovals}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-teal-500/20 text-teal-400 border-b-2 border-teal-400'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Manage Users</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-teal-500/20 text-teal-400 border-b-2 border-teal-400'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Analytics</span>
            </div>
          </button>
        </div>

        <div className="p-6">
          {/* Pending Approvals Tab */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Users Awaiting Approval</h3>
                <div className="text-sm text-gray-400">
                  {pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} waiting for approval
                </div>
              </div>
              
              {pendingUsers.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-400">No pending approvals</p>
                  <p className="text-gray-500 text-sm mt-2">All users have been reviewed and approved!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map(user => (
                    <div key={user.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">
                            {user.full_name || 'No name provided'}
                          </h4>
                          <p className="text-gray-300 text-sm">{user.email}</p>
                          <p className="text-gray-400 text-xs">
                            Registered: {new Date(user.created_at).toLocaleDateString()} at {new Date(user.created_at).toLocaleTimeString()}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          {/* Approve as Candidate */}
                          <button
                            onClick={() => approveUser(user.id, 'candidate')}
                            disabled={processing === user.id}
                            className="flex items-center space-x-1 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Approve as Candidate - Can take challenges and participate in interviews"
                          >
                            {processing === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium">Candidate</span>
                          </button>

                          {/* Approve as Interviewer */}
                          <button
                            onClick={() => approveUser(user.id, 'interviewer')}
                            disabled={processing === user.id}
                            className="flex items-center space-x-1 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500/30"
                            title="Approve as Interviewer - Can create challenges, manage sessions, and access admin features"
                          >
                            {processing === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Crown className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium">Interviewer</span>
                          </button>

                          {/* Reject User */}
                          <button
                            onClick={() => rejectUser(user.id)}
                            disabled={processing === user.id}
                            className="flex items-center space-x-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Reject and delete this user account"
                          >
                            <UserX className="w-4 h-4" />
                            <span className="text-sm">Reject</span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Role Explanation */}
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="grid md:grid-cols-2 gap-3 text-xs">
                          <div className="bg-blue-500/10 rounded p-2">
                            <div className="flex items-center space-x-1 mb-1">
                              <UserCheck className="w-3 h-3 text-blue-400" />
                              <span className="text-blue-400 font-medium">Candidate</span>
                            </div>
                            <p className="text-gray-400">Can take challenges, participate in interviews, and view their results.</p>
                          </div>
                          <div className="bg-purple-500/10 rounded p-2">
                            <div className="flex items-center space-x-1 mb-1">
                              <Crown className="w-3 h-3 text-purple-400" />
                              <span className="text-purple-400 font-medium">Interviewer</span>
                            </div>
                            <p className="text-gray-400">Can create challenges, manage sessions, send invitations, and access admin dashboard.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Users Tab - Enhanced with Better Role Management */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">User Role Management</h3>
                <div className="text-sm text-gray-400">
                  {stats.interviewers} interviewer{stats.interviewers !== 1 ? 's' : ''}, {stats.candidates} candidate{stats.candidates !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="space-y-3">
                {allUsers.filter(u => u.role !== 'pending').map(userProfile => (
                  <div key={userProfile.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-white">
                            {userProfile.full_name || 'No name provided'}
                          </h4>
                          {userProfile.id === user?.id && (
                            <span className="px-2 py-1 bg-teal-500/20 text-teal-400 text-xs rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm">{userProfile.email}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                          <span>Joined: {new Date(userProfile.created_at).toLocaleDateString()}</span>
                          {userProfile.updated_at !== userProfile.created_at && (
                            <span>Updated: {new Date(userProfile.updated_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {/* Current Role Display */}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          userProfile.role === 'interviewer'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {userProfile.role === 'interviewer' ? (
                            <div className="flex items-center space-x-1">
                              <Crown className="w-3 h-3" />
                              <span>Interviewer</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <UserCheck className="w-3 h-3" />
                              <span>Candidate</span>
                            </div>
                          )}
                        </span>
                        
                        {/* Role Management - Only for other users */}
                        {userProfile.id !== user?.id && (
                          <div className="flex items-center space-x-2">
                            {editingRole === userProfile.id ? (
                              // Edit Mode
                              <div className="flex items-center space-x-2">
                                <select
                                  value={newRole}
                                  onChange={(e) => setNewRole(e.target.value as 'interviewer' | 'candidate')}
                                  disabled={processing === userProfile.id}
                                  className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                                >
                                  <option value="candidate" className="bg-gray-800">👤 Candidate</option>
                                  <option value="interviewer" className="bg-gray-800">👑 Interviewer</option>
                                </select>
                                
                                <button
                                  onClick={() => saveRoleChange(userProfile.id)}
                                  disabled={processing === userProfile.id}
                                  className="p-1 text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                                  title="Save role change"
                                >
                                  {processing === userProfile.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Save className="w-4 h-4" />
                                  )}
                                </button>
                                
                                <button
                                  onClick={cancelRoleEdit}
                                  disabled={processing === userProfile.id}
                                  className="p-1 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              // View Mode
                              <button
                                onClick={() => startRoleEdit(userProfile.id, userProfile.role)}
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                                title="Change user role"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Role Change Buttons - Alternative Method */}
                    {userProfile.id !== user?.id && editingRole !== userProfile.id && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Quick role change:</span>
                          <div className="flex space-x-2">
                            {userProfile.role !== 'candidate' && (
                              <button
                                onClick={() => {
                                  setNewRole('candidate')
                                  saveRoleChange(userProfile.id)
                                }}
                                disabled={processing === userProfile.id}
                                className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                              >
                                Make Candidate
                              </button>
                            )}
                            {userProfile.role !== 'interviewer' && (
                              <button
                                onClick={() => {
                                  setNewRole('interviewer')
                                  saveRoleChange(userProfile.id)
                                }}
                                disabled={processing === userProfile.id}
                                className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded text-xs hover:bg-purple-500/30 transition-colors disabled:opacity-50 border border-purple-500/30"
                              >
                                Make Interviewer
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white mb-4">Platform Analytics</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-3">User Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 flex items-center space-x-2">
                        <Crown className="w-4 h-4 text-purple-400" />
                        <span>Interviewers</span>
                      </span>
                      <span className="text-purple-400 font-medium">{stats.interviewers}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 flex items-center space-x-2">
                        <UserCheck className="w-4 h-4 text-blue-400" />
                        <span>Candidates</span>
                      </span>
                      <span className="text-blue-400 font-medium">{stats.candidates}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <span>Pending</span>
                      </span>
                      <span className="text-yellow-400 font-medium">{stats.pendingApprovals}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-3">Session Statistics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Sessions</span>
                      <span className="text-white font-medium">{stats.totalSessions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Active</span>
                      <span className="text-blue-400 font-medium">{stats.activeSessions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Completed</span>
                      <span className="text-green-400 font-medium">{stats.completedSessions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Average Score</span>
                      <span className="text-teal-400 font-medium">{stats.averageScore}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}