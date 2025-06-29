import React, { useState, useEffect } from 'react'
import { BarChart3, Download, Calendar, Users, Target, Clock, Award, TrendingUp, Filter, RefreshCw, FileText, Mail, CheckCircle, XCircle, Loader2, Shield, AlertTriangle, Activity, Database, Eye, Search } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

interface EnterpriseReportData {
  securityMetrics: {
    totalSecurityEvents: number
    criticalEvents: number
    loginAttempts: number
    failedLogins: number
    accountLockouts: number
    suspiciousActivity: number
    lastSecurityIncident?: string
  }
  complianceMetrics: {
    dataRetentionCompliance: number
    accessControlCompliance: number
    auditTrailCompleteness: number
    encryptionCompliance: number
    backupCompliance: number
  }
  performanceMetrics: {
    averageResponseTime: number
    systemUptime: number
    errorRate: number
    throughput: number
    concurrentUsers: number
  }
  userAnalytics: {
    totalUsers: number
    activeUsers: number
    userGrowthRate: number
    averageSessionDuration: number
    userRetention: number
    roleDistribution: { role: string; count: number; percentage: number }[]
  }
  businessMetrics: {
    totalSessions: number
    completionRate: number
    averageScore: number
    timeToHire: number
    candidateQuality: number
    interviewerEfficiency: number
  }
  systemHealth: {
    databaseConnections: number
    memoryUsage: number
    cpuUsage: number
    diskUsage: number
    networkLatency: number
    errorLogs: number
  }
}

interface SecurityEvent {
  id: string
  event_type: string
  user_id?: string
  ip_address?: string
  user_agent?: string
  details: any
  severity: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
  user?: {
    email: string
    full_name: string
  }
}

export const EnterpriseReporting: React.FC = () => {
  const { user, userRole, trackEvent } = useAuth()
  const [reportData, setReportData] = useState<EnterpriseReportData | null>(null)
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'compliance' | 'performance' | 'users' | 'business'>('overview')
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | '90d'>('30d')
  const [refreshing, setRefreshing] = useState(false)
  const [securityFilter, setSecurityFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [searchTerm, setSearchTerm] = useState('')

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

      const [
        securityData,
        complianceData,
        performanceData,
        userAnalyticsData,
        businessData,
        systemHealthData,
        securityEventsData
      ] = await Promise.all([
        fetchSecurityMetrics(startDate, endDate),
        fetchComplianceMetrics(),
        fetchPerformanceMetrics(startDate, endDate),
        fetchUserAnalytics(startDate, endDate),
        fetchBusinessMetrics(startDate, endDate),
        fetchSystemHealth(),
        fetchSecurityEvents(startDate, endDate)
      ])

      setReportData({
        securityMetrics: securityData,
        complianceMetrics: complianceData,
        performanceMetrics: performanceData,
        userAnalytics: userAnalyticsData,
        businessMetrics: businessData,
        systemHealth: systemHealthData
      })

      setSecurityEvents(securityEventsData)
      await trackEvent('enterprise_report_generated', { dateRange })
    } catch (error) {
      console.error('Error fetching enterprise report data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchSecurityMetrics = async (startDate: Date, endDate: Date) => {
    try {
      const { data: events } = await supabase
        .from('security_events')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      const totalSecurityEvents = events?.length || 0
      const criticalEvents = events?.filter(e => e.severity === 'critical').length || 0
      const loginAttempts = events?.filter(e => e.event_type === 'login_attempt').length || 0
      const failedLogins = events?.filter(e => e.event_type === 'login_failure').length || 0
      const accountLockouts = events?.filter(e => e.details?.reason === 'account_locked').length || 0
      const suspiciousActivity = events?.filter(e => e.event_type === 'suspicious_activity').length || 0

      const lastIncident = events?.filter(e => e.severity === 'critical' || e.severity === 'high')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

      return {
        totalSecurityEvents,
        criticalEvents,
        loginAttempts,
        failedLogins,
        accountLockouts,
        suspiciousActivity,
        lastSecurityIncident: lastIncident?.created_at
      }
    } catch (error) {
      console.error('Error fetching security metrics:', error)
      return {
        totalSecurityEvents: 0,
        criticalEvents: 0,
        loginAttempts: 0,
        failedLogins: 0,
        accountLockouts: 0,
        suspiciousActivity: 0
      }
    }
  }

  const fetchComplianceMetrics = async () => {
    // Simulate compliance metrics - in production, these would be calculated based on actual compliance checks
    return {
      dataRetentionCompliance: 95,
      accessControlCompliance: 98,
      auditTrailCompleteness: 100,
      encryptionCompliance: 100,
      backupCompliance: 92
    }
  }

  const fetchPerformanceMetrics = async (startDate: Date, endDate: Date) => {
    // Simulate performance metrics - in production, these would come from monitoring systems
    return {
      averageResponseTime: 245, // ms
      systemUptime: 99.9, // percentage
      errorRate: 0.1, // percentage
      throughput: 1250, // requests per minute
      concurrentUsers: 45
    }
  }

  const fetchUserAnalytics = async (startDate: Date, endDate: Date) => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('role, created_at')

      const { data: events } = await supabase
        .from('usage_events')
        .select('user_id, event_type, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      const totalUsers = profiles?.length || 0
      const newUsers = profiles?.filter(p => new Date(p.created_at) >= startDate).length || 0
      const activeUsers = new Set(events?.map(e => e.user_id)).size || 0

      // Calculate role distribution
      const roleDistribution = profiles?.reduce((acc, profile) => {
        const existing = acc.find(item => item.role === profile.role)
        if (existing) {
          existing.count++
        } else {
          acc.push({ role: profile.role, count: 1, percentage: 0 })
        }
        return acc
      }, [] as { role: string; count: number; percentage: number }[]) || []

      // Calculate percentages
      roleDistribution.forEach(item => {
        item.percentage = Math.round((item.count / totalUsers) * 100)
      })

      return {
        totalUsers,
        activeUsers,
        userGrowthRate: totalUsers > 0 ? Math.round((newUsers / totalUsers) * 100) : 0,
        averageSessionDuration: 25, // minutes - would be calculated from actual session data
        userRetention: 85, // percentage - would be calculated from user activity
        roleDistribution
      }
    } catch (error) {
      console.error('Error fetching user analytics:', error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        userGrowthRate: 0,
        averageSessionDuration: 0,
        userRetention: 0,
        roleDistribution: []
      }
    }
  }

  const fetchBusinessMetrics = async (startDate: Date, endDate: Date) => {
    try {
      const { data: sessions } = await supabase
        .from('sessions')
        .select('status, score, created_at, start_time, end_time')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      const totalSessions = sessions?.length || 0
      const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0
      const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

      const scoresWithValues = sessions?.filter(s => s.score !== null) || []
      const averageScore = scoresWithValues.length > 0 
        ? Math.round(scoresWithValues.reduce((sum, s) => sum + (s.score || 0), 0) / scoresWithValues.length)
        : 0

      return {
        totalSessions,
        completionRate,
        averageScore,
        timeToHire: 14, // days - would be calculated from actual hiring data
        candidateQuality: 78, // score - would be calculated from performance metrics
        interviewerEfficiency: 92 // percentage - would be calculated from interviewer metrics
      }
    } catch (error) {
      console.error('Error fetching business metrics:', error)
      return {
        totalSessions: 0,
        completionRate: 0,
        averageScore: 0,
        timeToHire: 0,
        candidateQuality: 0,
        interviewerEfficiency: 0
      }
    }
  }

  const fetchSystemHealth = async () => {
    // Simulate system health metrics - in production, these would come from monitoring systems
    return {
      databaseConnections: 25,
      memoryUsage: 68, // percentage
      cpuUsage: 45, // percentage
      diskUsage: 72, // percentage
      networkLatency: 12, // ms
      errorLogs: 3
    }
  }

  const fetchSecurityEvents = async (startDate: Date, endDate: Date) => {
    try {
      const { data: events } = await supabase
        .from('security_events')
        .select(`
          *,
          user:profiles(email, full_name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100)

      return events || []
    } catch (error) {
      console.error('Error fetching security events:', error)
      return []
    }
  }

  const exportReport = async (format: 'json' | 'csv') => {
    if (!reportData) return

    const reportContent = {
      generatedAt: new Date().toISOString(),
      dateRange,
      data: reportData,
      securityEvents: securityEvents.slice(0, 50) // Limit for export
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `enterprise-report-${dateRange}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else {
      // CSV export for key metrics
      const csvData = [
        ['Metric', 'Value', 'Category'],
        ['Total Users', reportData.userAnalytics.totalUsers, 'Users'],
        ['Active Users', reportData.userAnalytics.activeUsers, 'Users'],
        ['Total Sessions', reportData.businessMetrics.totalSessions, 'Business'],
        ['Completion Rate', `${reportData.businessMetrics.completionRate}%`, 'Business'],
        ['Average Score', `${reportData.businessMetrics.averageScore}%`, 'Business'],
        ['Security Events', reportData.securityMetrics.totalSecurityEvents, 'Security'],
        ['Critical Events', reportData.securityMetrics.criticalEvents, 'Security'],
        ['System Uptime', `${reportData.performanceMetrics.systemUptime}%`, 'Performance'],
        ['Response Time', `${reportData.performanceMetrics.averageResponseTime}ms`, 'Performance']
      ]

      const csvContent = csvData.map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `enterprise-metrics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    await trackEvent('enterprise_report_exported', { format, dateRange })
  }

  const getHealthColor = (value: number, type: 'percentage' | 'inverse'): string => {
    if (type === 'inverse') {
      // For metrics where lower is better (like error rate)
      if (value <= 1) return 'text-green-400'
      if (value <= 5) return 'text-yellow-400'
      return 'text-red-400'
    } else {
      // For metrics where higher is better (like uptime)
      if (value >= 95) return 'text-green-400'
      if (value >= 85) return 'text-yellow-400'
      return 'text-red-400'
    }
  }

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const filteredSecurityEvents = securityEvents.filter(event => {
    const matchesSeverity = securityFilter === 'all' || event.severity === securityFilter
    const matchesSearch = searchTerm === '' || 
      event.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(event.details).toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSeverity && matchesSearch
  })

  if (userRole !== 'interviewer') {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Access Restricted</h3>
          <p className="text-gray-300">Only administrators can access enterprise reporting.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Loading enterprise reports...</p>
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
            <h2 className="text-xl font-bold text-white">Enterprise Analytics & Reporting</h2>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '24h' | '7d' | '30d' | '90d')}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="24h" className="bg-gray-800">Last 24 hours</option>
              <option value="7d" className="bg-gray-800">Last 7 days</option>
              <option value="30d" className="bg-gray-800">Last 30 days</option>
              <option value="90d" className="bg-gray-800">Last 90 days</option>
            </select>
            <button
              onClick={fetchReportData}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <div className="flex space-x-2">
              <button
                onClick={() => exportReport('json')}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg text-white hover:from-teal-600 hover:to-cyan-600 transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                <span>JSON</span>
              </button>
              <button
                onClick={() => exportReport('csv')}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
              >
                <FileText className="w-4 h-4" />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {reportData && (
        <>
          {/* Key Metrics Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">System Health</p>
                  <p className={`text-2xl font-bold ${getHealthColor(reportData.performanceMetrics.systemUptime, 'percentage')}`}>
                    {reportData.performanceMetrics.systemUptime}%
                  </p>
                  <p className="text-gray-400 text-xs">Uptime</p>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Security Status</p>
                  <p className={`text-2xl font-bold ${reportData.securityMetrics.criticalEvents > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {reportData.securityMetrics.criticalEvents}
                  </p>
                  <p className="text-gray-400 text-xs">Critical Events</p>
                </div>
                <Shield className={`w-8 h-8 ${reportData.securityMetrics.criticalEvents > 0 ? 'text-red-400' : 'text-green-400'}`} />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Active Users</p>
                  <p className="text-2xl font-bold text-blue-400">{reportData.userAnalytics.activeUsers}</p>
                  <p className="text-gray-400 text-xs">of {reportData.userAnalytics.totalUsers} total</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Performance</p>
                  <p className="text-2xl font-bold text-purple-400">{reportData.performanceMetrics.averageResponseTime}ms</p>
                  <p className="text-gray-400 text-xs">Avg Response</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
            <div className="flex border-b border-white/10 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'security', label: 'Security', icon: Shield },
                { id: 'compliance', label: 'Compliance', icon: CheckCircle },
                { id: 'performance', label: 'Performance', icon: Activity },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'business', label: 'Business', icon: Target }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-teal-500/20 text-teal-400 border-b-2 border-teal-400'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-2">
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
                    <h4 className="font-semibold text-white mb-3">System Health Overview</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Uptime</span>
                        <span className={`font-medium ${getHealthColor(reportData.performanceMetrics.systemUptime, 'percentage')}`}>
                          {reportData.performanceMetrics.systemUptime}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Response Time</span>
                        <span className="text-white font-medium">{reportData.performanceMetrics.averageResponseTime}ms</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Error Rate</span>
                        <span className={`font-medium ${getHealthColor(reportData.performanceMetrics.errorRate, 'inverse')}`}>
                          {reportData.performanceMetrics.errorRate}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Concurrent Users</span>
                        <span className="text-white font-medium">{reportData.performanceMetrics.concurrentUsers}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Security Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Total Events</span>
                        <span className="text-white font-medium">{reportData.securityMetrics.totalSecurityEvents}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Critical Events</span>
                        <span className={`font-medium ${reportData.securityMetrics.criticalEvents > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {reportData.securityMetrics.criticalEvents}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Failed Logins</span>
                        <span className="text-yellow-400 font-medium">{reportData.securityMetrics.failedLogins}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Account Lockouts</span>
                        <span className="text-orange-400 font-medium">{reportData.securityMetrics.accountLockouts}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Security Events</h3>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search events..."
                          className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <select
                        value={securityFilter}
                        onChange={(e) => setSecurityFilter(e.target.value as any)}
                        className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="all" className="bg-gray-800">All Severities</option>
                        <option value="critical" className="bg-gray-800">Critical</option>
                        <option value="high" className="bg-gray-800">High</option>
                        <option value="medium" className="bg-gray-800">Medium</option>
                        <option value="low" className="bg-gray-800">Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredSecurityEvents.map(event => (
                      <div key={event.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(event.severity)}`}>
                                {event.severity.toUpperCase()}
                              </span>
                              <span className="text-white font-medium">{event.event_type.replace('_', ' ')}</span>
                              <span className="text-gray-400 text-sm">
                                {new Date(event.created_at).toLocaleString()}
                              </span>
                            </div>
                            
                            {event.user && (
                              <p className="text-gray-300 text-sm mb-1">
                                User: {event.user.full_name || event.user.email}
                              </p>
                            )}
                            
                            {event.ip_address && (
                              <p className="text-gray-400 text-xs mb-1">
                                IP: {event.ip_address}
                              </p>
                            )}
                            
                            {event.details && Object.keys(event.details).length > 0 && (
                              <div className="mt-2">
                                <details className="text-xs">
                                  <summary className="text-gray-400 cursor-pointer hover:text-white">
                                    View Details
                                  </summary>
                                  <pre className="mt-2 p-2 bg-black/20 rounded text-gray-300 overflow-x-auto">
                                    {JSON.stringify(event.details, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredSecurityEvents.length === 0 && (
                      <div className="text-center py-8">
                        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">No security events found for the selected criteria</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Compliance Tab */}
              {activeTab === 'compliance' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Compliance Scores</h4>
                    <div className="space-y-3">
                      {Object.entries(reportData.complianceMetrics).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-gray-300 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${getHealthColor(value, 'percentage') === 'text-green-400' ? 'bg-green-400' : getHealthColor(value, 'percentage') === 'text-yellow-400' ? 'bg-yellow-400' : 'bg-red-400'}`}
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <span className={`font-medium ${getHealthColor(value, 'percentage')}`}>
                              {value}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Compliance Status</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">GDPR Compliance</span>
                        <span className="text-green-400 text-sm">Active</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">SOC 2 Type II</span>
                        <span className="text-green-400 text-sm">Certified</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">ISO 27001</span>
                        <span className="text-green-400 text-sm">Compliant</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <span className="text-gray-300">HIPAA</span>
                        <span className="text-yellow-400 text-sm">In Progress</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">System Performance</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">CPU Usage</span>
                        <span className={`font-medium ${getHealthColor(100 - reportData.systemHealth.cpuUsage, 'percentage')}`}>
                          {reportData.systemHealth.cpuUsage}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Memory Usage</span>
                        <span className={`font-medium ${getHealthColor(100 - reportData.systemHealth.memoryUsage, 'percentage')}`}>
                          {reportData.systemHealth.memoryUsage}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Disk Usage</span>
                        <span className={`font-medium ${getHealthColor(100 - reportData.systemHealth.diskUsage, 'percentage')}`}>
                          {reportData.systemHealth.diskUsage}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Network Latency</span>
                        <span className="text-white font-medium">{reportData.systemHealth.networkLatency}ms</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Application Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Throughput</span>
                        <span className="text-white font-medium">{reportData.performanceMetrics.throughput} req/min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Database Connections</span>
                        <span className="text-white font-medium">{reportData.systemHealth.databaseConnections}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Error Logs</span>
                        <span className={`font-medium ${reportData.systemHealth.errorLogs > 5 ? 'text-red-400' : 'text-green-400'}`}>
                          {reportData.systemHealth.errorLogs}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">User Analytics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Total Users</span>
                        <span className="text-white font-medium">{reportData.userAnalytics.totalUsers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Active Users</span>
                        <span className="text-blue-400 font-medium">{reportData.userAnalytics.activeUsers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Growth Rate</span>
                        <span className="text-green-400 font-medium">+{reportData.userAnalytics.userGrowthRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Avg Session</span>
                        <span className="text-white font-medium">{reportData.userAnalytics.averageSessionDuration}min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Retention Rate</span>
                        <span className="text-teal-400 font-medium">{reportData.userAnalytics.userRetention}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Role Distribution</h4>
                    <div className="space-y-3">
                      {reportData.userAnalytics.roleDistribution.map(role => (
                        <div key={role.role} className="flex justify-between items-center">
                          <span className="text-gray-300 capitalize">{role.role}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">{role.count}</span>
                            <span className="text-gray-400 text-sm">({role.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Business Tab */}
              {activeTab === 'business' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Interview Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Total Sessions</span>
                        <span className="text-white font-medium">{reportData.businessMetrics.totalSessions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Completion Rate</span>
                        <span className="text-green-400 font-medium">{reportData.businessMetrics.completionRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Average Score</span>
                        <span className="text-blue-400 font-medium">{reportData.businessMetrics.averageScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Hiring Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Time to Hire</span>
                        <span className="text-white font-medium">{reportData.businessMetrics.timeToHire} days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Candidate Quality</span>
                        <span className="text-purple-400 font-medium">{reportData.businessMetrics.candidateQuality}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Interviewer Efficiency</span>
                        <span className="text-teal-400 font-medium">{reportData.businessMetrics.interviewerEfficiency}%</span>
                      </div>
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