import React, { useState, useEffect } from 'react'
import { Users, Shield, Mail, MessageSquare, Settings, Search, Filter, Ban, CheckCircle, Clock, Send, Trash2, Edit3, Eye, UserCheck, UserX, Loader2, AlertTriangle, Bell, Plus, User, Reply, MailSearch as MarkEmailRead } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: 'interviewer' | 'candidate' | 'pending'
  created_at: string
  updated_at: string
  last_login?: string
  is_active?: boolean
  login_count?: number
}

interface UserMessage {
  id: string
  from_user_id: string
  to_user_id: string
  subject: string
  message: string
  is_read: boolean
  created_at: string
  from_user?: {
    full_name: string
    email: string
  }
  to_user?: {
    full_name: string
    email: string
  }
}

interface UserActivity {
  id: string
  user_id: string
  event_type: string
  event_data: any
  created_at: string
  user?: {
    full_name: string
    email: string
  }
}

export const UserDashboard: React.FC = () => {
  const { user, userRole, updateUserRole, trackEvent } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [messages, setMessages] = useState<UserMessage[]>([])
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'users' | 'messages' | 'activity' | 'settings'>('users')
  
  // User management state
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'interviewer' | 'candidate' | 'pending'>('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | 'message' | 'deactivate' | ''>('')
  
  // Message state
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageForm, setMessageForm] = useState({
    recipients: [] as string[],
    subject: '',
    message: '',
    isReply: false,
    originalMessageId: null as string | null
  })
  const [sendingMessage, setSendingMessage] = useState(false)
  
  // User creation state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)
  const [createUserForm, setCreateUserForm] = useState({
    email: '',
    fullName: '',
    role: 'candidate' as 'interviewer' | 'candidate',
    password: '',
    sendWelcomeEmail: true
  })
  const [creatingUser, setCreatingUser] = useState(false)
  
  // Activity filters
  const [activityFilter, setActivityFilter] = useState<'all' | 'login' | 'signup' | 'role_change' | 'session'>('all')
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d')

  useEffect(() => {
    if (userRole === 'interviewer') {
      fetchData()
    }
  }, [userRole, dateRange, activityFilter])

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchUsers(),
        fetchMessages(),
        fetchActivities()
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

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

      // Enhance user data with activity info
      const enhancedUsers = await Promise.all(
        (data || []).map(async (user) => {
          const { data: lastLogin } = await supabase
            .from('usage_events')
            .select('created_at')
            .eq('user_id', user.id)
            .eq('event_type', 'user_login')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          const { count: loginCount } = await supabase
            .from('usage_events')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('event_type', 'user_login')

          return {
            ...user,
            last_login: lastLogin?.created_at,
            login_count: loginCount || 0,
            is_active: lastLogin ? new Date(lastLogin.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : false
          }
        })
      )

      setUsers(enhancedUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('user_messages')
        .select(`
          *,
          from_user:profiles!user_messages_from_user_id_fkey(full_name, email),
          to_user:profiles!user_messages_to_user_id_fkey(full_name, email)
        `)
        .or(`from_user_id.eq.${user?.id},to_user_id.eq.${user?.id}`)
        .order('created_at', { ascending: false })

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching messages:', error)
        return
      }

      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const fetchActivities = async () => {
    try {
      const endDate = new Date()
      const startDate = new Date()
      
      switch (dateRange) {
        case '24h':
          startDate.setDate(endDate.getDate() - 1)
          break
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(endDate.getDate() - 90)
          break
      }

      let query = supabase
        .from('usage_events')
        .select(`
          *,
          user:profiles(full_name, email)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100)

      if (activityFilter !== 'all') {
        query = query.eq('event_type', activityFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching activities:', error)
        return
      }

      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const createUser = async () => {
    if (!createUserForm.email || !createUserForm.password || !createUserForm.fullName) {
      alert('Please fill in all required fields')
      return
    }

    if (createUserForm.password.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    setCreatingUser(true)
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: createUserForm.email,
        password: createUserForm.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: createUserForm.fullName,
          role: createUserForm.role
        }
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        alert(`Error creating user: ${authError.message}`)
        return
      }

      if (!authData.user) {
        alert('Failed to create user')
        return
      }

      // Create profile
      const profileData = {
        id: authData.user.id,
        email: createUserForm.email,
        full_name: createUserForm.fullName,
        role: createUserForm.role
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)

      if (profileError) {
        console.error('Error creating profile:', profileError)
        // Try to clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id)
        alert(`Error creating user profile: ${profileError.message}`)
        return
      }

      // Send welcome message if requested
      if (createUserForm.sendWelcomeEmail) {
        const welcomeMessage = {
          from_user_id: user?.id,
          to_user_id: authData.user.id,
          subject: 'Welcome to Oddball\'s Tech Challenge Platform',
          message: `Welcome to our technical interview platform! Your account has been created with ${createUserForm.role} privileges. You can now log in using your email and the password provided to you.`,
          is_read: false
        }

        await supabase
          .from('user_messages')
          .insert(welcomeMessage)
      }

      // Track event
      await trackEvent('user_created_by_admin', {
        createdUserId: authData.user.id,
        role: createUserForm.role,
        email: createUserForm.email
      })

      // Reset form and close modal
      setCreateUserForm({
        email: '',
        fullName: '',
        role: 'candidate',
        password: '',
        sendWelcomeEmail: true
      })
      setShowCreateUserModal(false)

      // Refresh users list
      await fetchUsers()

      alert(`User ${createUserForm.email} created successfully!`)

    } catch (error) {
      console.error('Error creating user:', error)
      alert('An unexpected error occurred while creating the user')
    } finally {
      setCreatingUser(false)
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCreateUserForm(prev => ({ ...prev, password }))
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return

    try {
      switch (bulkAction) {
        case 'approve':
          await Promise.all(
            selectedUsers.map(userId => updateUserRole(userId, 'candidate'))
          )
          break
        case 'reject':
          if (confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
            await Promise.all(
              selectedUsers.map(userId => 
                supabase.from('profiles').delete().eq('id', userId)
              )
            )
          }
          break
        case 'message':
          setMessageForm(prev => ({ 
            ...prev, 
            recipients: selectedUsers,
            isReply: false,
            originalMessageId: null
          }))
          setShowMessageModal(true)
          break
        case 'deactivate':
          // Implement user deactivation logic
          break
      }

      if (bulkAction !== 'message') {
        await fetchUsers()
        setSelectedUsers([])
        setBulkAction('')
        await trackEvent('bulk_user_action', { action: bulkAction, userCount: selectedUsers.length })
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
    }
  }

  const replyToMessage = (message: UserMessage) => {
    const isFromCurrentUser = message.from_user_id === user?.id
    const recipientId = isFromCurrentUser ? message.to_user_id : message.from_user_id
    const recipientName = isFromCurrentUser 
      ? message.to_user?.full_name || message.to_user?.email
      : message.from_user?.full_name || message.from_user?.email

    // Prepare reply subject
    let replySubject = message.subject
    if (!replySubject.toLowerCase().startsWith('re:')) {
      replySubject = `Re: ${replySubject}`
    }

    // Prepare reply message with original content
    const originalMessage = `

------- Original Message -------
From: ${message.from_user?.full_name || message.from_user?.email}
To: ${message.to_user?.full_name || message.to_user?.email}
Date: ${new Date(message.created_at).toLocaleString()}
Subject: ${message.subject}

${message.message}`

    setMessageForm({
      recipients: [recipientId],
      subject: replySubject,
      message: originalMessage,
      isReply: true,
      originalMessageId: message.id
    })
    setShowMessageModal(true)
  }

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('user_messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('to_user_id', user?.id)

      if (!error) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        ))
        await trackEvent('message_marked_read', { messageId })
      }
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!messageForm.subject || !messageForm.message || messageForm.recipients.length === 0) return

    setSendingMessage(true)
    try {
      const messageData = messageForm.recipients.map(recipientId => ({
        from_user_id: user?.id,
        to_user_id: recipientId,
        subject: messageForm.subject,
        message: messageForm.message,
        is_read: false
      }))

      const { error } = await supabase
        .from('user_messages')
        .insert(messageData)

      if (!error) {
        setMessageForm({ 
          recipients: [], 
          subject: '', 
          message: '',
          isReply: false,
          originalMessageId: null
        })
        setShowMessageModal(false)
        setSelectedUsers([])
        setBulkAction('')
        await fetchMessages()
        await trackEvent('message_sent', { 
          recipientCount: messageForm.recipients.length,
          isReply: messageForm.isReply
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  // Handle tile clicks for navigation and filtering
  const handleTileClick = (action: string) => {
    switch (action) {
      case 'total-users':
        setActiveTab('users')
        setRoleFilter('all')
        setSearchTerm('')
        break
      case 'pending-approval':
        setActiveTab('users')
        setRoleFilter('pending')
        setSearchTerm('')
        break
      case 'messages':
        setActiveTab('messages')
        break
      case 'activity':
        setActiveTab('activity')
        break
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getStatusColor = (role: string, isActive: boolean) => {
    if (role === 'pending') return 'bg-yellow-500/20 text-yellow-400'
    if (!isActive) return 'bg-gray-500/20 text-gray-400'
    if (role === 'interviewer') return 'bg-purple-500/20 text-purple-400'
    return 'bg-green-500/20 text-green-400'
  }

  const getActivityIcon = (eventType: string) => {
    switch (eventType) {
      case 'user_login': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'user_signup': return <UserCheck className="w-4 h-4 text-blue-400" />
      case 'role_updated': return <Shield className="w-4 h-4 text-purple-400" />
      case 'session_created': return <Clock className="w-4 h-4 text-orange-400" />
      default: return <Bell className="w-4 h-4 text-gray-400" />
    }
  }

  if (userRole !== 'interviewer') {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Access Restricted</h3>
          <p className="text-gray-300">Only administrators can access the user dashboard.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Loading user dashboard...</p>
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
            <Users className="w-6 h-6 text-teal-400" />
            <h2 className="text-xl font-bold text-white">User Management Dashboard</h2>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg text-white hover:from-teal-600 hover:to-cyan-600 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </button>
            {selectedUsers.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm">{selectedUsers.length} selected</span>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value as any)}
                  className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="" className="bg-gray-800">Bulk Actions</option>
                  <option value="approve" className="bg-gray-800">Approve as Candidates</option>
                  <option value="message" className="bg-gray-800">Send Message</option>
                  <option value="reject" className="bg-gray-800">Delete Users</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  className="px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded text-white text-sm hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
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
                {users.length}
              </p>
              <p className="text-green-400 text-xs">
                {users.filter(u => u.is_active).length} active
              </p>
            </div>
            <Users className="w-8 h-8 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => handleTileClick('pending-approval')}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 text-left group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors">
                {users.filter(u => u.role === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400 group-hover:scale-110 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => handleTileClick('messages')}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 text-left group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Messages</p>
              <p className="text-2xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                {messages.length}
              </p>
              <p className="text-blue-300 text-xs">
                {messages.filter(m => !m.is_read && m.to_user_id === user?.id).length} unread
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => handleTileClick('activity')}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 text-left group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">Recent Activity</p>
              <p className="text-2xl font-bold text-purple-400 group-hover:text-purple-300 transition-colors">
                {activities.length}
              </p>
              <p className="text-purple-300 text-xs">Last {dateRange}</p>
            </div>
            <Bell className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
        <div className="flex border-b border-white/10">
          {[
            { id: 'users', label: 'Users', icon: Users },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
            { id: 'activity', label: 'Activity', icon: Bell },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-teal-500/20 text-teal-400 border-b-2 border-teal-400'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'messages' && messages.filter(m => !m.is_read && m.to_user_id === user?.id).length > 0 && (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                    {messages.filter(m => !m.is_read && m.to_user_id === user?.id).length}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all" className="bg-gray-800">All Roles</option>
                  <option value="pending" className="bg-gray-800">Pending</option>
                  <option value="candidate" className="bg-gray-800">Candidates</option>
                  <option value="interviewer" className="bg-gray-800">Interviewers</option>
                </select>
              </div>

              {/* Users List */}
              <div className="space-y-3">
                {filteredUsers.map(userProfile => (
                  <div key={userProfile.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userProfile.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(prev => [...prev, userProfile.id])
                            } else {
                              setSelectedUsers(prev => prev.filter(id => id !== userProfile.id))
                            }
                          }}
                          className="w-4 h-4 text-teal-500 bg-white/10 border-white/20 rounded focus:ring-teal-500"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-white">
                              {userProfile.full_name || 'No name provided'}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(userProfile.role, userProfile.is_active || false)}`}>
                              {userProfile.role}
                            </span>
                            {userProfile.id === user?.id && (
                              <span className="px-2 py-1 bg-teal-500/20 text-teal-400 text-xs rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-gray-300 text-sm">{userProfile.email}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                            <span>Joined: {new Date(userProfile.created_at).toLocaleDateString()}</span>
                            {userProfile.last_login && (
                              <span>Last login: {new Date(userProfile.last_login).toLocaleDateString()}</span>
                            )}
                            <span>Logins: {userProfile.login_count}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setMessageForm(prev => ({ 
                              ...prev, 
                              recipients: [userProfile.id],
                              isReply: false,
                              originalMessageId: null
                            }))
                            setShowMessageModal(true)
                          }}
                          className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                          title="Send message"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        {userProfile.role === 'pending' && (
                          <>
                            <button
                              onClick={() => updateUserRole(userProfile.id, 'candidate')}
                              className="p-2 text-green-400 hover:text-green-300 transition-colors"
                              title="Approve as candidate"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateUserRole(userProfile.id, 'interviewer')}
                              className="p-2 text-purple-400 hover:text-purple-300 transition-colors"
                              title="Approve as interviewer"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Messages</h3>
                <button
                  onClick={() => {
                    setMessageForm({
                      recipients: [],
                      subject: '',
                      message: '',
                      isReply: false,
                      originalMessageId: null
                    })
                    setShowMessageModal(true)
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg text-white hover:from-teal-600 hover:to-cyan-600 transition-all duration-200"
                >
                  <Send className="w-4 h-4" />
                  <span>New Message</span>
                </button>
              </div>

              <div className="space-y-3">
                {messages.map(message => (
                  <div key={message.id} className={`bg-white/5 rounded-lg p-4 border border-white/10 ${!message.is_read && message.to_user_id === user?.id ? 'border-blue-500/30' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-white">{message.subject}</h4>
                          {!message.is_read && message.to_user_id === user?.id && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm mb-2 whitespace-pre-wrap">{message.message}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <span>
                            {message.from_user_id === user?.id ? 'To' : 'From'}: {
                              message.from_user_id === user?.id 
                                ? message.to_user?.full_name || message.to_user?.email
                                : message.from_user?.full_name || message.from_user?.email
                            }
                          </span>
                          <span>{new Date(message.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {/* Reply button - only show for received messages */}
                        {message.to_user_id === user?.id && (
                          <button
                            onClick={() => replyToMessage(message)}
                            className="p-2 text-teal-400 hover:text-teal-300 transition-colors"
                            title="Reply to message"
                          >
                            <Reply className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Mark as read button - only for unread received messages */}
                        {!message.is_read && message.to_user_id === user?.id && (
                          <button
                            onClick={() => markAsRead(message.id)}
                            className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                            title="Mark as read"
                          >
                            <MarkEmailRead className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No messages yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value as any)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all" className="bg-gray-800">All Activities</option>
                  <option value="login" className="bg-gray-800">Logins</option>
                  <option value="signup" className="bg-gray-800">Signups</option>
                  <option value="role_change" className="bg-gray-800">Role Changes</option>
                  <option value="session" className="bg-gray-800">Sessions</option>
                </select>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="24h" className="bg-gray-800">Last 24 hours</option>
                  <option value="7d" className="bg-gray-800">Last 7 days</option>
                  <option value="30d" className="bg-gray-800">Last 30 days</option>
                  <option value="90d" className="bg-gray-800">Last 90 days</option>
                </select>
              </div>

              <div className="space-y-3">
                {activities.map(activity => (
                  <div key={activity.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center space-x-3">
                      {getActivityIcon(activity.event_type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">
                            {activity.user?.full_name || activity.user?.email || 'Unknown User'}
                          </span>
                          <span className="text-gray-300 text-sm">
                            {activity.event_type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(activity.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {activities.length === 0 && (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-white">Dashboard Settings</h3>
              
              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3">Notification Preferences</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="w-4 h-4 text-teal-500 bg-white/10 border-white/20 rounded focus:ring-teal-500" defaultChecked />
                    <span className="text-gray-300">Email notifications for new user registrations</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="w-4 h-4 text-teal-500 bg-white/10 border-white/20 rounded focus:ring-teal-500" defaultChecked />
                    <span className="text-gray-300">Email notifications for completed sessions</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="w-4 h-4 text-teal-500 bg-white/10 border-white/20 rounded focus:ring-teal-500" />
                    <span className="text-gray-300">Daily activity digest</span>
                  </label>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3">Auto-approval Settings</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="w-4 h-4 text-teal-500 bg-white/10 border-white/20 rounded focus:ring-teal-500" />
                    <span className="text-gray-300">Auto-approve users with company email domains</span>
                  </label>
                  <input
                    type="text"
                    placeholder="@company.com, @partner.com"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Add New User</h3>
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={createUserForm.fullName}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Role *
                </label>
                <select
                  value={createUserForm.role}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="candidate" className="bg-gray-800">Candidate</option>
                  <option value="interviewer" className="bg-gray-800">Interviewer</option>
                </select>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Password *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={createUserForm.password}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter password"
                  />
                  <button
                    onClick={generatePassword}
                    className="px-3 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors text-sm"
                    title="Generate password"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-gray-400 text-xs mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sendWelcomeEmail"
                  checked={createUserForm.sendWelcomeEmail}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, sendWelcomeEmail: e.target.checked }))}
                  className="w-4 h-4 text-teal-500 bg-white/10 border-white/20 rounded focus:ring-teal-500"
                />
                <label htmlFor="sendWelcomeEmail" className="text-white text-sm">
                  Send welcome message
                </label>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="flex-1 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createUser}
                disabled={creatingUser || !createUserForm.email || !createUserForm.password || !createUserForm.fullName}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {creatingUser ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <User className="w-4 h-4" />
                    <span>Create User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {messageForm.isReply ? 'Reply to Message' : 'Send Message'}
              </h3>
              <button
                onClick={() => setShowMessageModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Recipients ({messageForm.recipients.length} selected)
                </label>
                {messageForm.recipients.length === 0 && !messageForm.isReply && (
                  <p className="text-gray-400 text-sm">Select users from the Users tab or use bulk actions</p>
                )}
                {messageForm.isReply && (
                  <p className="text-gray-400 text-sm">Replying to original sender</p>
                )}
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Message subject"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Message
                </label>
                <textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={messageForm.isReply ? 8 : 4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Type your message here..."
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendMessage}
                disabled={sendingMessage || !messageForm.subject || !messageForm.message || messageForm.recipients.length === 0}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {sendingMessage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{messageForm.isReply ? 'Send Reply' : 'Send Message'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}