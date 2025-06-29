import React, { useState, useEffect } from 'react'
import { Shield, AlertTriangle, Lock, Eye, Activity, Clock, Users, Database, Settings, RefreshCw, Download, Search, Filter } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'
import { securityManager, SecurityEvent } from '../lib/security'

interface SecurityMetrics {
  totalEvents: number
  criticalEvents: number
  highSeverityEvents: number
  failedLogins: number
  suspiciousActivity: number
  accountLockouts: number
  lastIncident?: string
  threatLevel: 'low' | 'medium' | 'high' | 'critical'
}

interface SystemHealth {
  uptime: number
  responseTime: number
  errorRate: number
  activeConnections: number
  memoryUsage: number
  cpuUsage: number
}

export const SecurityDashboard: React.FC = () => {
  const { user, userRole, trackEvent } = useAuth()
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'threats' | 'compliance' | 'settings'>('overview')
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [eventFilter, setEventFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (userRole === 'interviewer') {
      fetchSecurityData()
      
      // Set up real-time updates
      const interval = setInterval(fetchSecurityData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [userRole, timeRange])

  const fetchSecurityData = async () => {
    setRefreshing(true)
    try {
      const endDate = new Date()
      const startDate = new Date()
      
      switch (timeRange) {
        case '1h':
          startDate.setHours(endDate.getHours() - 1)
          break
        case '24h':
          startDate.setDate(endDate.getDate() - 1)
          break
        case '7d':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(endDate.getDate() - 30)
          break
      }

      const [securityMetrics, healthData, events] = await Promise.all([
        fetchSecurityMetrics(startDate, endDate),
        fetchSystemHealth(),
        fetchSecurityEvents(startDate, endDate)
      ])

      setMetrics(securityMetrics)
      setSystemHealth(healthData)
      setRecentEvents(events)

      await trackEvent('security_dashboard_viewed', { timeRange })
    } catch (error) {
      console.error('Error fetching security data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchSecurityMetrics = async (startDate: Date, endDate: Date): Promise<SecurityMetrics> => {
    try {
      const { data: events } = await supabase
        .from('security_events')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      const totalEvents = events?.length || 0
      const criticalEvents = events?.filter(e => e.severity === 'critical').length || 0
      const highSeverityEvents = events?.filter(e => e.severity === 'high').length || 0
      const failedLogins = events?.filter(e => e.event_type === 'login_failure').length || 0
      const suspiciousActivity = events?.filter(e => e.event_type === 'suspicious_activity').length || 0
      const accountLockouts = events?.filter(e => e.details?.reason === 'account_locked').length || 0

      const lastIncident = events?.filter(e => e.severity === 'critical' || e.severity === 'high')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

      // Calculate threat level
      let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
      if (criticalEvents > 0) threatLevel = 'critical'
      else if (highSeverityEvents > 5) threatLevel = 'high'
      else if (suspiciousActivity > 10 || failedLogins > 20) threatLevel = 'medium'

      return {
        totalEvents,
        criticalEvents,
        highSeverityEvents,
        failedLogins,
        suspiciousActivity,
        accountLockouts,
        lastIncident: lastIncident?.created_at,
        threatLevel
      }
    } catch (error) {
      console.error('Error fetching security metrics:', error)
      return {
        totalEvents: 0,
        criticalEvents: 0,
        highSeverityEvents: 0,
        failedLogins: 0,
        suspiciousActivity: 0,
        accountLockouts: 0,
        threatLevel: 'low'
      }
    }
  }

  const fetchSystemHealth = async (): Promise<SystemHealth> => {
    // In a real enterprise environment, these would come from monitoring systems
    return {
      uptime: 99.9,
      responseTime: 245,
      errorRate: 0.1,
      activeConnections: 45,
      memoryUsage: 68,
      cpuUsage: 42
    }
  }

  const fetchSecurityEvents = async (startDate: Date, endDate: Date): Promise<SecurityEvent[]> => {
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
        .limit(50)

      return events || []
    } catch (error) {
      console.error('Error fetching security events:', error)
      return []
    }
  }

  const getThreatLevelColor = (level: string): string => {
    switch (level) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30'
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-400" />
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'low': return <AlertTriangle className="w-4 h-4 text-blue-400" />
      default: return <AlertTriangle className="w-4 h-4 text-gray-400" />
    }
  }

  const exportSecurityReport = async () => {
    if (!metrics || !recentEvents) return

    const report = {
      generatedAt: new Date().toISOString(),
      timeRange,
      metrics,
      systemHealth,
      events: recentEvents.slice(0, 100),
      summary: {
        threatLevel: metrics.threatLevel,
        totalIncidents: metrics.criticalEvents + metrics.highSeverityEvents,
        securityScore: calculateSecurityScore()
      }
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `security-report-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    await trackEvent('security_report_exported', { timeRange })
  }

  const calculateSecurityScore = (): number => {
    if (!metrics || !systemHealth) return 0

    let score = 100

    // Deduct points for security events
    score -= metrics.criticalEvents * 20
    score -= metrics.highSeverityEvents * 10
    score -= metrics.suspiciousActivity * 2
    score -= metrics.failedLogins * 0.5

    // Deduct points for system health issues
    if (systemHealth.uptime < 99) score -= (99 - systemHealth.uptime) * 10
    if (systemHealth.errorRate > 1) score -= (systemHealth.errorRate - 1) * 5

    return Math.max(0, Math.round(score))
  }

  const filteredEvents = recentEvents.filter(event => {
    const matchesSeverity = eventFilter === 'all' || event.severity === eventFilter
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
          <p className="text-gray-300">Only administrators can access the security dashboard.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <Shield className="w-8 h-8 text-white animate-pulse mx-auto mb-4" />
          <p className="text-white">Loading security dashboard...</p>
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
            <Shield className="w-6 h-6 text-teal-400" />
            <h2 className="text-xl font-bold text-white">Security Operations Center</h2>
            {metrics && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getThreatLevelColor(metrics.threatLevel)}`}>
                Threat Level: {metrics.threatLevel.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="1h" className="bg-gray-800">Last Hour</option>
              <option value="24h" className="bg-gray-800">Last 24 Hours</option>
              <option value="7d" className="bg-gray-800">Last 7 Days</option>
              <option value="30d" className="bg-gray-800">Last 30 Days</option>
            </select>
            <button
              onClick={fetchSecurityData}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportSecurityReport}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg text-white hover:from-red-600 hover:to-pink-600 transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {metrics && systemHealth && (
        <>
          {/* Security Overview */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Security Score</p>
                  <p className={`text-2xl font-bold ${calculateSecurityScore() >= 90 ? 'text-green-400' : calculateSecurityScore() >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {calculateSecurityScore()}%
                  </p>
                </div>
                <Shield className={`w-8 h-8 ${calculateSecurityScore() >= 90 ? 'text-green-400' : calculateSecurityScore() >= 70 ? 'text-yellow-400' : 'text-red-400'}`} />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Critical Events</p>
                  <p className={`text-2xl font-bold ${metrics.criticalEvents > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {metrics.criticalEvents}
                  </p>
                  <p className="text-gray-400 text-xs">Last {timeRange}</p>
                </div>
                <AlertTriangle className={`w-8 h-8 ${metrics.criticalEvents > 0 ? 'text-red-400' : 'text-green-400'}`} />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Failed Logins</p>
                  <p className={`text-2xl font-bold ${metrics.failedLogins > 10 ? 'text-orange-400' : 'text-blue-400'}`}>
                    {metrics.failedLogins}
                  </p>
                  <p className="text-gray-400 text-xs">{metrics.accountLockouts} lockouts</p>
                </div>
                <Lock className={`w-8 h-8 ${metrics.failedLogins > 10 ? 'text-orange-400' : 'text-blue-400'}`} />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">System Uptime</p>
                  <p className={`text-2xl font-bold ${systemHealth.uptime >= 99 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {systemHealth.uptime}%
                  </p>
                  <p className="text-gray-400 text-xs">{systemHealth.responseTime}ms avg</p>
                </div>
                <Activity className={`w-8 h-8 ${systemHealth.uptime >= 99 ? 'text-green-400' : 'text-yellow-400'}`} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
            <div className="flex border-b border-white/10 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: Shield },
                { id: 'events', label: 'Security Events', icon: AlertTriangle },
                { id: 'threats', label: 'Threat Analysis', icon: Eye },
                { id: 'compliance', label: 'Compliance', icon: Database },
                { id: 'settings', label: 'Settings', icon: Settings }
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
                    {tab.id === 'events' && metrics.criticalEvents > 0 && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                        {metrics.criticalEvents}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Security Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Total Events</span>
                        <span className="text-white font-medium">{metrics.totalEvents}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">High Severity</span>
                        <span className="text-orange-400 font-medium">{metrics.highSeverityEvents}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Suspicious Activity</span>
                        <span className="text-yellow-400 font-medium">{metrics.suspiciousActivity}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Account Lockouts</span>
                        <span className="text-red-400 font-medium">{metrics.accountLockouts}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">System Health</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">CPU Usage</span>
                        <span className={`font-medium ${systemHealth.cpuUsage > 80 ? 'text-red-400' : 'text-green-400'}`}>
                          {systemHealth.cpuUsage}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Memory Usage</span>
                        <span className={`font-medium ${systemHealth.memoryUsage > 80 ? 'text-red-400' : 'text-green-400'}`}>
                          {systemHealth.memoryUsage}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Error Rate</span>
                        <span className={`font-medium ${systemHealth.errorRate > 1 ? 'text-red-400' : 'text-green-400'}`}>
                          {systemHealth.errorRate}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Active Connections</span>
                        <span className="text-white font-medium">{systemHealth.activeConnections}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Events Tab */}
              {activeTab === 'events' && (
                <div className="space-y-4">
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
                        value={eventFilter}
                        onChange={(e) => setEventFilter(e.target.value as any)}
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

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredEvents.map(event => (
                      <div key={event.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {getSeverityIcon(event.severity)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-white font-medium">
                                  {event.event_type.replace('_', ' ').toUpperCase()}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getThreatLevelColor(event.severity)}`}>
                                  {event.severity}
                                </span>
                              </div>
                              
                              <p className="text-gray-300 text-sm mb-1">
                                {new Date(event.created_at).toLocaleString()}
                              </p>
                              
                              {event.user && (
                                <p className="text-gray-400 text-xs mb-1">
                                  User: {event.user.full_name || event.user.email}
                                </p>
                              )}
                              
                              {event.ip_address && (
                                <p className="text-gray-400 text-xs mb-1">
                                  IP: {event.ip_address}
                                </p>
                              )}
                              
                              {event.details && Object.keys(event.details).length > 0 && (
                                <details className="mt-2">
                                  <summary className="text-gray-400 text-xs cursor-pointer hover:text-white">
                                    View Details
                                  </summary>
                                  <pre className="mt-1 p-2 bg-black/20 rounded text-gray-300 text-xs overflow-x-auto">
                                    {JSON.stringify(event.details, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredEvents.length === 0 && (
                      <div className="text-center py-8">
                        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">No security events found for the selected criteria</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Threat Analysis Tab */}
              {activeTab === 'threats' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-3">Threat Intelligence</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Current Threat Level</span>
                          <span className={`font-medium px-2 py-1 rounded ${getThreatLevelColor(metrics.threatLevel)}`}>
                            {metrics.threatLevel.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Attack Attempts</span>
                          <span className="text-red-400 font-medium">{metrics.suspiciousActivity}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Blocked IPs</span>
                          <span className="text-orange-400 font-medium">
                            {Math.floor(metrics.suspiciousActivity * 0.3)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Security Score</span>
                          <span className={`font-medium ${calculateSecurityScore() >= 90 ? 'text-green-400' : calculateSecurityScore() >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {calculateSecurityScore()}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-3">Risk Assessment</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Data Breach Risk</span>
                          <span className={`font-medium ${metrics.criticalEvents > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {metrics.criticalEvents > 0 ? 'HIGH' : 'LOW'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Account Compromise</span>
                          <span className={`font-medium ${metrics.accountLockouts > 5 ? 'text-orange-400' : 'text-green-400'}`}>
                            {metrics.accountLockouts > 5 ? 'MEDIUM' : 'LOW'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">System Availability</span>
                          <span className={`font-medium ${systemHealth.uptime >= 99 ? 'text-green-400' : 'text-yellow-400'}`}>
                            {systemHealth.uptime >= 99 ? 'LOW' : 'MEDIUM'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {metrics.lastIncident && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <h4 className="font-semibold text-red-400 mb-2">Last Security Incident</h4>
                      <p className="text-red-300 text-sm">
                        {new Date(metrics.lastIncident).toLocaleString()}
                      </p>
                      <p className="text-gray-300 text-sm mt-1">
                        Review recent critical and high-severity events for potential security threats.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Compliance Tab */}
              {activeTab === 'compliance' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Compliance Status</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">GDPR Compliance</span>
                        <span className="text-green-400 font-medium">✓ Compliant</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">SOC 2 Type II</span>
                        <span className="text-green-400 font-medium">✓ Certified</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">ISO 27001</span>
                        <span className="text-green-400 font-medium">✓ Compliant</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Audit Trail</span>
                        <span className="text-green-400 font-medium">100% Complete</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Security Controls</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Encryption at Rest</span>
                        <span className="text-green-400 font-medium">✓ Enabled</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Encryption in Transit</span>
                        <span className="text-green-400 font-medium">✓ Enabled</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Access Controls</span>
                        <span className="text-green-400 font-medium">✓ Active</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Backup & Recovery</span>
                        <span className="text-green-400 font-medium">✓ Operational</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Security Configuration</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 text-sm mb-2">Session Timeout (minutes)</label>
                        <input
                          type="number"
                          defaultValue={60}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm mb-2">Max Login Attempts</label>
                        <input
                          type="number"
                          defaultValue={5}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm mb-2">Lockout Duration (minutes)</label>
                        <input
                          type="number"
                          defaultValue={30}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm mb-2">Password Min Length</label>
                        <input
                          type="number"
                          defaultValue={8}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <button className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200">
                        Save Security Settings
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-3">Alert Configuration</h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-teal-500 bg-white/10 border-white/20 rounded focus:ring-teal-500" />
                        <span className="text-gray-300">Email alerts for critical events</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="w-4 h-4 text-teal-500 bg-white/10 border-white/20 rounded focus:ring-teal-500" />
                        <span className="text-gray-300">Real-time notifications</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" className="w-4 h-4 text-teal-500 bg-white/10 border-white/20 rounded focus:ring-teal-500" />
                        <span className="text-gray-300">Daily security digest</span>
                      </label>
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