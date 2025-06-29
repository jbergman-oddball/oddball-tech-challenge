import React, { useState, useEffect } from 'react'
import { BarChart3, Download, Calendar, Users, Target, Clock, Award, TrendingUp, Filter, RefreshCw, FileText, Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

interface ReportData {
  userStats: {
    totalUsers: number
    activeUsers: number
    newUsersThisMonth: number
    usersByRole: { role: string; count: number }[]
    userGrowth: { month: string; count: number }[]
  }
  sessionStats: {
    totalSessions: number
    completedSessions: number
    averageScore: number
    averageTimeSpent: number
    sessionsByStatus: { status: string; count: number }[]
    scoreDistribution: { range: string; count: number }[]
    sessionsOverTime: { month: string; count: number }[]
  }
  challengeStats: {
    totalChallenges: number
    activeChallenges: number
    challengesByDifficulty: { difficulty: string; count: number }[]
    challengesByCategory: { category: string; count: number }[]
    popularChallenges: { title: string; sessions: number; avgScore: number }[]
  }
  invitationStats: {
    totalInvitations: number
    acceptedInvitations: number
    pendingInvitations: number
    acceptanceRate: number
    invitationsByRole: { role: string; count: number }[]
  }
  usageEvents: {
    totalEvents: number
    eventsByType: { event_type: string; count: number }[]
    dailyActivity: { date: string; events: number }[]
  }
}

export const ReportingDashboard: React.FC = () => {
  const { user, userRole, trackEvent } = useAuth()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'sessions' | 'challenges' | 'activity'>('overview')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (userRole === 'interviewer') {
      fetchReportData()
    }
  }, [userRole, dateRange])

  const fetchReportData = async () => {
    setRefreshing(true)
    try {
      const endDate = new Date()
      const startDate = new Date()
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(endDate.getDate() - 90)
          break
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
      }

      const [
        usersData,
        sessionsData,
        challengesData,
        invitationsData,
        eventsData
      ] = await Promise.all([
        fetchUserStats(startDate, endDate),
        fetchSessionStats(startDate, endDate),
        fetchChallengeStats(),
        fetchInvitationStats(startDate, endDate),
        fetchUsageEvents(startDate, endDate)
      ])

      setReportData({
        userStats: usersData,
        sessionStats: sessionsData,
        challengeStats: challengesData,
        invitationStats: invitationsData,
        usageEvents: eventsData
      })

      await trackEvent('report_generated', { dateRange })
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchUserStats = async (startDate: Date, endDate: Date) => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('role, created_at')

    if (!profiles) return {
      totalUsers: 0,
      activeUsers: 0,
      newUsersThisMonth: 0,
      usersByRole: [],
      userGrowth: []
    }

    const totalUsers = profiles.length
    const newUsersThisMonth = profiles.filter(p => 
      new Date(p.created_at) >= startDate
    ).length

    const usersByRole = profiles.reduce((acc, profile) => {
      const existing = acc.find(item => item.role === profile.role)
      if (existing) {
        existing.count++
      } else {
        acc.push({ role: profile.role, count: 1 })
      }
      return acc
    }, [] as { role: string; count: number }[])

    // Generate user growth data (simplified)
    const userGrowth = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date()
      monthDate.setMonth(monthDate.getMonth() - i)
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      
      const count = profiles.filter(p => {
        const createdAt = new Date(p.created_at)
        return createdAt >= monthStart && createdAt <= monthEnd
      }).length

      userGrowth.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count
      })
    }

    return {
      totalUsers,
      activeUsers: totalUsers, // Simplified - could track last login
      newUsersThisMonth,
      usersByRole,
      userGrowth
    }
  }

  const fetchSessionStats = async (startDate: Date, endDate: Date) => {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('status, score, time_spent, created_at, start_time, end_time')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (!sessions) return {
      totalSessions: 0,
      completedSessions: 0,
      averageScore: 0,
      averageTimeSpent: 0,
      sessionsByStatus: [],
      scoreDistribution: [],
      sessionsOverTime: []
    }

    const totalSessions = sessions.length
    const completedSessions = sessions.filter(s => s.status === 'completed').length
    
    const scoresWithValues = sessions.filter(s => s.score !== null)
    const averageScore = scoresWithValues.length > 0 
      ? Math.round(scoresWithValues.reduce((sum, s) => sum + (s.score || 0), 0) / scoresWithValues.length)
      : 0

    const timeSpentValues = sessions.filter(s => s.time_spent !== null)
    const averageTimeSpent = timeSpentValues.length > 0
      ? Math.round(timeSpentValues.reduce((sum, s) => sum + (s.time_spent || 0), 0) / timeSpentValues.length)
      : 0

    const sessionsByStatus = sessions.reduce((acc, session) => {
      const existing = acc.find(item => item.status === session.status)
      if (existing) {
        existing.count++
      } else {
        acc.push({ status: session.status, count: 1 })
      }
      return acc
    }, [] as { status: string; count: number }[])

    // Score distribution
    const scoreDistribution = [
      { range: '0-20', count: 0 },
      { range: '21-40', count: 0 },
      { range: '41-60', count: 0 },
      { range: '61-80', count: 0 },
      { range: '81-100', count: 0 }
    ]

    scoresWithValues.forEach(session => {
      const score = session.score || 0
      if (score <= 20) scoreDistribution[0].count++
      else if (score <= 40) scoreDistribution[1].count++
      else if (score <= 60) scoreDistribution[2].count++
      else if (score <= 80) scoreDistribution[3].count++
      else scoreDistribution[4].count++
    })

    // Sessions over time (simplified)
    const sessionsOverTime = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date()
      monthDate.setMonth(monthDate.getMonth() - i)
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
      
      const count = sessions.filter(s => {
        const createdAt = new Date(s.created_at)
        return createdAt >= monthStart && createdAt <= monthEnd
      }).length

      sessionsOverTime.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count
      })
    }

    return {
      totalSessions,
      completedSessions,
      averageScore,
      averageTimeSpent,
      sessionsByStatus,
      scoreDistribution,
      sessionsOverTime
    }
  }

  const fetchChallengeStats = async () => {
    const { data: challenges } = await supabase
      .from('challenges')
      .select('difficulty, category, title, status')

    if (!challenges) return {
      totalChallenges: 0,
      activeChallenges: 0,
      challengesByDifficulty: [],
      challengesByCategory: [],
      popularChallenges: []
    }

    const totalChallenges = challenges.length
    const activeChallenges = challenges.filter(c => c.status === 'active').length

    const challengesByDifficulty = challenges.reduce((acc, challenge) => {
      const existing = acc.find(item => item.difficulty === challenge.difficulty)
      if (existing) {
        existing.count++
      } else {
        acc.push({ difficulty: challenge.difficulty, count: 1 })
      }
      return acc
    }, [] as { difficulty: string; count: number }[])

    const challengesByCategory = challenges.reduce((acc, challenge) => {
      const existing = acc.find(item => item.category === challenge.category)
      if (existing) {
        existing.count++
      } else {
        acc.push({ category: challenge.category, count: 1 })
      }
      return acc
    }, [] as { category: string; count: number }[])

    // Get popular challenges (would need to join with sessions)
    const popularChallenges = challenges.slice(0, 5).map(c => ({
      title: c.title,
      sessions: Math.floor(Math.random() * 20) + 1, // Mock data
      avgScore: Math.floor(Math.random() * 40) + 60 // Mock data
    }))

    return {
      totalChallenges,
      activeChallenges,
      challengesByDifficulty,
      challengesByCategory,
      popularChallenges
    }
  }

  const fetchInvitationStats = async (startDate: Date, endDate: Date) => {
    const { data: invitations } = await supabase
      .from('invitations')
      .select('status, role, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (!invitations) return {
      totalInvitations: 0,
      acceptedInvitations: 0,
      pendingInvitations: 0,
      acceptanceRate: 0,
      invitationsByRole: []
    }

    const totalInvitations = invitations.length
    const acceptedInvitations = invitations.filter(i => i.status === 'accepted').length
    const pendingInvitations = invitations.filter(i => i.status === 'pending').length
    const acceptanceRate = totalInvitations > 0 ? Math.round((acceptedInvitations / totalInvitations) * 100) : 0

    const invitationsByRole = invitations.reduce((acc, invitation) => {
      const existing = acc.find(item => item.role === invitation.role)
      if (existing) {
        existing.count++
      } else {
        acc.push({ role: invitation.role, count: 1 })
      }
      return acc
    }, [] as { role: string; count: number }[])

    return {
      totalInvitations,
      acceptedInvitations,
      pendingInvitations,
      acceptanceRate,
      invitationsByRole
    }
  }

  const fetchUsageEvents = async (startDate: Date, endDate: Date) => {
    const { data: events } = await supabase
      .from('usage_events')
      .select('event_type, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    if (!events) return {
      totalEvents: 0,
      eventsByType: [],
      dailyActivity: []
    }

    const totalEvents = events.length

    const eventsByType = events.reduce((acc, event) => {
      const existing = acc.find(item => item.event_type === event.event_type)
      if (existing) {
        existing.count++
      } else {
        acc.push({ event_type: event.event_type, count: 1 })
      }
      return acc
    }, [] as { event_type: string; count: number }[])

    // Daily activity (simplified)
    const dailyActivity = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      
      const count = events.filter(e => {
        const createdAt = new Date(e.created_at)
        return createdAt >= dayStart && createdAt < dayEnd
      }).length

      dailyActivity.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        events: count
      })
    }

    return {
      totalEvents,
      eventsByType,
      dailyActivity
    }
  }

  const exportReport = async () => {
    if (!reportData) return

    const reportContent = {
      generatedAt: new Date().toISOString(),
      dateRange,
      data: reportData
    }

    const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `oddball-tech-challenge-report-${dateRange}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    await trackEvent('report_exported', { dateRange })
  }

  // Handle tile clicks for navigation
  const handleTileClick = (action: string) => {
    switch (action) {
      case 'total-users':
        setActiveTab('users')
        break
      case 'total-sessions':
        setActiveTab('sessions')
        break
      case 'average-score':
        setActiveTab('sessions')
        break
      case 'invitation-rate':
        setActiveTab('overview')
        break
    }
  }

  if (userRole !== 'interviewer') {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Access Restricted</h3>
          <p className="text-gray-300">Only interviewers can access reporting.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Loading reports...</p>
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
            <BarChart3 className="w-6 h-6 text-teal-400" />
            <h2 className="text-xl font-bold text-white">Analytics & Reporting</h2>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="7d" className="bg-gray-800">Last 7 days</option>
              <option value="30d" className="bg-gray-800">Last 30 days</option>
              <option value="90d" className="bg-gray-800">Last 90 days</option>
              <option value="1y" className="bg-gray-800">Last year</option>
            </select>
            <button
              onClick={fetchReportData}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportReport}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg text-white hover:from-teal-600 hover:to-cyan-600 transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <>
          {/* Overview Stats - Now Clickable */}
          <div className="grid md:grid-cols-4 gap-4">
            <button
              onClick={() => handleTileClick('total-users')}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white group-hover:text-teal-400 transition-colors">
                    {reportData.userStats.totalUsers}
                  </p>
                  <p className="text-green-400 text-xs">+{reportData.userStats.newUsersThisMonth} this period</p>
                </div>
                <Users className="w-8 h-8 text-teal-400 group-hover:scale-110 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => handleTileClick('total-sessions')}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Sessions</p>
                  <p className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    {reportData.sessionStats.totalSessions}
                  </p>
                  <p className="text-blue-400 text-xs">{reportData.sessionStats.completedSessions} completed</p>
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
                  <p className="text-2xl font-bold text-white group-hover:text-orange-400 transition-colors">
                    {reportData.sessionStats.averageScore}%
                  </p>
                  <p className="text-orange-400 text-xs">{reportData.sessionStats.averageTimeSpent}min avg time</p>
                </div>
                <Award className="w-8 h-8 text-orange-400 group-hover:scale-110 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => handleTileClick('invitation-rate')}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-200 text-left group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Invitation Rate</p>
                  <p className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
                    {reportData.invitationStats.acceptanceRate}%
                  </p>
                  <p className="text-purple-400 text-xs">{reportData.invitationStats.totalInvitations} sent</p>
                </div>
                <Mail className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
            </button>
          </div>

          {/* Tabs */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
            <div className="flex border-b border-white/10">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'sessions', label: 'Sessions', icon: Target },
                { id: 'challenges', label: 'Challenges', icon: Award },
                { id: 'activity', label: 'Activity', icon: TrendingUp }
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
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">User Growth</h4>
                    <div className="space-y-2">
                      {reportData.userStats.userGrowth.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">{item.month}</span>
                          <span className="text-teal-400 font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Session Trends</h4>
                    <div className="space-y-2">
                      {reportData.sessionStats.sessionsOverTime.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">{item.month}</span>
                          <span className="text-blue-400 font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Users by Role</h4>
                    <div className="space-y-2">
                      {reportData.userStats.usersByRole.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-300 capitalize">{item.role}</span>
                          <span className="text-white font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">User Activity</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Total Events</span>
                        <span className="text-white font-medium">{reportData.usageEvents.totalEvents}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Daily Average</span>
                        <span className="text-white font-medium">
                          {Math.round(reportData.usageEvents.totalEvents / 7)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sessions Tab */}
              {activeTab === 'sessions' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-3">Sessions by Status</h4>
                      <div className="space-y-2">
                        {reportData.sessionStats.sessionsByStatus.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-gray-300 capitalize">{item.status}</span>
                            <span className="text-white font-medium">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-3">Score Distribution</h4>
                      <div className="space-y-2">
                        {reportData.sessionStats.scoreDistribution.map((item, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-gray-300">{item.range}%</span>
                            <span className="text-white font-medium">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Challenges Tab */}
              {activeTab === 'challenges' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Challenges by Difficulty</h4>
                    <div className="space-y-2">
                      {reportData.challengeStats.challengesByDifficulty.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-300">{item.difficulty}</span>
                          <span className="text-white font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Popular Challenges</h4>
                    <div className="space-y-2">
                      {reportData.challengeStats.popularChallenges.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm truncate">{item.title}</span>
                          <div className="text-right">
                            <div className="text-white font-medium text-sm">{item.sessions} sessions</div>
                            <div className="text-teal-400 text-xs">{item.avgScore}% avg</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Events by Type</h4>
                    <div className="space-y-2">
                      {reportData.usageEvents.eventsByType.slice(0, 10).map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">{item.event_type.replace('_', ' ')}</span>
                          <span className="text-white font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Daily Activity</h4>
                    <div className="space-y-2">
                      {reportData.usageEvents.dailyActivity.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">{item.date}</span>
                          <span className="text-white font-medium">{item.events}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}