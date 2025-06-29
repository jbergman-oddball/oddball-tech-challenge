import React, { useEffect, useState } from 'react'
import { Shield, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabase'

export const EmergencyRoleFix: React.FC = () => {
  const { user, userRole, refreshAuth } = useAuth()
  const [fixing, setFixing] = useState(false)
  const [fixed, setFixed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-fix if user is logged in but has wrong role
  useEffect(() => {
    if (user && userRole === 'pending') {
      // Check if this user should be an interviewer based on their activity
      checkAndFixRole()
    }
  }, [user, userRole])

  const checkAndFixRole = async () => {
    if (!user) return

    setFixing(true)
    setError(null)

    try {
      // Check if this user has created challenges (indicating they should be an interviewer)
      const { data: challenges } = await supabase
        .from('challenges')
        .select('id')
        .eq('created_by', user.id)
        .limit(1)

      // Check if this user has created sessions
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id')
        .eq('created_by', user.id)
        .limit(1)

      // Check if this user has sent invitations
      const { data: invitations } = await supabase
        .from('invitations')
        .select('id')
        .eq('created_by', user.id)
        .limit(1)

      // If user has admin activity, fix their role
      if (challenges?.length || sessions?.length || invitations?.length) {
        console.log('User has admin activity, fixing role to interviewer')
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role: 'interviewer',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (updateError) {
          console.error('Error fixing role:', updateError)
          setError('Failed to fix role. Please contact support.')
          return
        }

        // Refresh auth to get updated role
        await refreshAuth()
        setFixed(true)
        
        // Reload page after a short delay to ensure clean state
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        // Check if there are no interviewers at all
        const { data: interviewers } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'interviewer')
          .limit(1)

        if (!interviewers?.length) {
          console.log('No interviewers found, promoting current user')
          
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              role: 'interviewer',
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

          if (updateError) {
            console.error('Error promoting user:', updateError)
            setError('Failed to fix role. Please contact support.')
            return
          }

          await refreshAuth()
          setFixed(true)
          
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Error checking role:', error)
      setError('Failed to check role status.')
    } finally {
      setFixing(false)
    }
  }

  const manualFix = async () => {
    if (!user) return

    setFixing(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: 'interviewer',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error fixing role:', updateError)
        setError('Failed to fix role. Please try refreshing the page.')
        return
      }

      await refreshAuth()
      setFixed(true)
      
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      console.error('Error fixing role:', error)
      setError('Failed to fix role.')
    } finally {
      setFixing(false)
    }
  }

  // Don't show if user is not logged in or already has correct role
  if (!user || userRole === 'interviewer') {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 w-full max-w-md">
        <div className="text-center">
          {fixed ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Role Fixed!</h2>
              <p className="text-gray-300 mb-4">
                Your admin privileges have been restored. The page will reload automatically.
              </p>
            </>
          ) : (
            <>
              <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Admin Access Issue</h2>
              <p className="text-gray-300 mb-6">
                Your account appears to be set as "pending" but you should have admin access. 
                This can happen after database updates.
              </p>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={manualFix}
                  disabled={fixing}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {fixing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Fixing Role...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>Restore Admin Access</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
                >
                  Refresh Page
                </button>
              </div>

              <p className="text-gray-400 text-xs mt-4">
                This will restore your interviewer role and admin dashboard access.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}