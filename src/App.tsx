import React, { useState, useEffect } from 'react';
import { Code, Loader2, LogOut, User, Shield, Plus, Users, BarChart3, Wand2 } from 'lucide-react';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { AuthModal } from './components/AuthModal';
import { ChallengeCreator } from './components/ChallengeCreator';

function AppContent() {
  const { user, loading, signOut, userRole } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'create-challenge'>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-teal-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Pending approval page
  if (user && userRole === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-teal-900 to-cyan-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-yellow-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">Account Under Review</h1>
            <p className="text-gray-300 mb-6">
              Your account has been created successfully! An administrator will review and approve your account shortly.
            </p>
            
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
              <p className="text-blue-400 text-sm">
                📧 You'll receive an email notification once your account is approved.
              </p>
            </div>

            <button
              onClick={signOut}
              className="w-full py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard for authenticated users
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-teal-900 to-cyan-900">
        {/* Navigation */}
        <nav className="bg-white/5 backdrop-blur-sm border-b border-white/10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1">
                  <Code className="w-6 h-6 text-teal-500" />
                </div>
                <span className="text-xl font-bold text-white">Oddball's Tech Challenge</span>
                <span className="text-sm text-gray-400 ml-4">
                  {userRole === 'interviewer' ? 'Admin Portal' : 'Candidate Portal'}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">Welcome, {user.email}</span>
                <button
                  onClick={signOut}
                  className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8">
          {userRole === 'interviewer' ? (
            <div className="space-y-6">
              {/* Admin Navigation */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setActiveView('dashboard')}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                        activeView === 'dashboard'
                          ? 'bg-teal-500/20 text-teal-400'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Dashboard</span>
                    </button>
                    <button
                      onClick={() => setActiveView('create-challenge')}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                        activeView === 'create-challenge'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <Wand2 className="w-4 h-4" />
                      <span>AI Challenge Creator</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Content based on active view */}
              {activeView === 'dashboard' ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                  
                  <h1 className="text-2xl font-bold text-white mb-4">Admin Dashboard</h1>
                  <p className="text-gray-300 mb-6">
                    Welcome to your admin portal! You can manage challenges, sessions, and users here.
                  </p>
                  
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                    <p className="text-blue-400 text-sm">
                      🎯 This is a simplified version of the Oddball Tech Challenge platform.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveView('create-challenge')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center space-x-2 mx-auto"
                  >
                    <Wand2 className="w-5 h-5" />
                    <span>Try AI Challenge Creator</span>
                  </button>
                </div>
              ) : (
                <ChallengeCreator />
              )}
            </div>
          ) : (
            /* Candidate Dashboard */
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-8 h-8 text-blue-400" />
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-4">Candidate Dashboard</h1>
              <p className="text-gray-300 mb-6">
                Welcome to your candidate portal! Your assigned challenges and interview sessions will appear here.
              </p>
              
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                <p className="text-blue-400 text-sm">
                  🎯 This is a simplified version of the Oddball Tech Challenge platform.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Login page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-teal-900 to-cyan-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 p-2">
              <Code className="w-8 h-8 text-teal-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Oddball's Tech Challenge</h1>
            <p className="text-gray-300">Simplified Interview Platform</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Code className="w-5 h-5" />
              <span>Get Started</span>
            </button>
          </div>

          <p className="text-center text-gray-400 text-sm mt-6">
            Powered by Supabase
          </p>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;