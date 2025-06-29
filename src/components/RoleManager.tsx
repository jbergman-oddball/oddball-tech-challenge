import React, { useState, useEffect } from 'react'
import { Users, Shield, Edit3, Save, X, Loader2 } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'interviewer' | 'candidate'
  created_at: string
  updated_at: string
}

export const RoleManager: React.FC = () => {
  const { user, userRole, updateUserRole, trackEvent } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [newRole, setNewRole] = useState<'interviewer' | 'candidate'>('candidate')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleUpdate = async (userId: string, role: 'interviewer' | 'candidate') => {
    setUpdating(true)
    try {
      const { error } = await updateUserRole(userId, role)
      
      if (!error) {
        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, role, updated_at: new Date().toISOString() } : u
        ))
        setEditingUser(null)
        await trackEvent('admin_role_update', { targetUserId: userId, newRole: role })
      } else {
        console.error('Error updating role:', error)
      }
    } catch (error) {
      console.error('Error updating role:', error)
    } finally {
      setUpdating(false)
    }
  }

  const startEdit = (userId: string, currentRole: 'interviewer' | 'candidate') => {
    setEditingUser(userId)
    setNewRole(currentRole)
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setNewRole('candidate')
  }

  if (userRole !== 'interviewer') {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Access Restricted</h3>
          <p className="text-gray-300">Only interviewers can manage user roles.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <div className="flex items-center space-x-2 mb-6">
        <Users className="w-6 h-6 text-teal-400" />
        <h2 className="text-xl font-bold text-white">User Role Management</h2>
      </div>

      <div className="space-y-4">
        {users.map(userProfile => (
          <div key={userProfile.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div>
                    <h3 className="font-semibold text-white">
                      {userProfile.full_name || 'No name provided'}
                    </h3>
                    <p className="text-gray-300 text-sm">{userProfile.email}</p>
                  </div>
                  {userProfile.id === user?.id && (
                    <span className="px-2 py-1 bg-teal-500/20 text-teal-400 text-xs rounded-full">
                      You
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {editingUser === userProfile.id ? (
                  <div className="flex items-center space-x-2">
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as 'interviewer' | 'candidate')}
                      className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      disabled={updating}
                    >
                      <option value="candidate" className="bg-gray-800">Candidate</option>
                      <option value="interviewer" className="bg-gray-800">Interviewer</option>
                    </select>
                    <button
                      onClick={() => handleRoleUpdate(userProfile.id, newRole)}
                      disabled={updating}
                      className="p-1 text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                    >
                      {updating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={updating}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      userProfile.role === 'interviewer'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {userProfile.role}
                    </span>
                    <button
                      onClick={() => startEdit(userProfile.id, userProfile.role)}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-400">
              Created: {new Date(userProfile.created_at).toLocaleDateString()}
              {userProfile.updated_at !== userProfile.created_at && (
                <span className="ml-4">
                  Updated: {new Date(userProfile.updated_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No users found</p>
          </div>
        )}
      </div>
    </div>
  )
}