'use client';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SessionWarningModal } from '@/components/session-warning-modal';
import { useRouter } from 'next/navigation';
import { clearSession, extendSession as backendExtendSession } from '@/lib/actions'; // Assuming extendSession action exists

type User = {
  id: string | null;
  email: string | null;
  // Add other user properties you might need
};

type AppContextType = {
  user: User | null;
};

const AppContext = createContext<AppContextType>({ user: null });

// Session timeout in minutes
const SESSION_TIMEOUT_MINUTES = 60;
// Warning time before timeout in minutes
const WARNING_TIME_MINUTES = 1; // 59 minutes mark

export function AppProvider({ children, user }: { children: React.ReactNode, user: User | null }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startSessionTimer = () => {
    // Clear any existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    // Set timeout for the warning modal (e.g., 59 minutes)
    const warningTime = (SESSION_TIMEOUT_MINUTES - WARNING_TIME_MINUTES) * 60 * 1000;
    warningTimeoutRef.current = setTimeout(() => {
      setIsModalOpen(true);
    }, warningTime);

    // Set timeout for automatic logout (e.g., 60 minutes)
    const timeout = SESSION_TIMEOUT_MINUTES * 60 * 1000;
    timeoutRef.current = setTimeout(() => {
      handleLogout(); // Automatically log out after timeout
    }, timeout);
  };

  const resetSessionTimer = () => {
    // Reset timers when user interacts or session is extended
     console.log('Resetting session timer'); // Debugging
    startSessionTimer();
  };

  const handleExtendSession = async () => {
    try {
      // Call your backend action to extend the session (get a new ID token)
      const result = await backendExtendSession(); // Assuming this action exists and refreshes the session cookie
      if (result.success) {
         console.log('Session extended successfully'); // Debugging
        setIsModalOpen(false);
        resetSessionTimer(); // Reset timer on successful extension
      } else {
         console.error('Failed to extend session:', result.error); // Debugging
        // If extending fails, maybe log out or show an error
         handleLogout();
      }
    } catch (error) {
      console.error('Error extending session:', error); // Debugging
       handleLogout();
    }
  };

  const handleLogout = async () => {
     console.log('Logging out...'); // Debugging
    // Clear session cookie and redirect to login
    await clearSession();
    router.push('/login');
    setIsModalOpen(false);
     // Clear timers on logout
     if (timeoutRef.current) clearTimeout(timeoutRefRef.current);
     if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
  };

  useEffect(() => {
    // Start the timer when the user is logged in (user object is not null)
    if (user && user.id) {
        console.log('User logged in, starting session timer'); // Debugging
      startSessionTimer();
    } else {
        // Clear timers if user logs out or is not logged in
        console.log('User not logged in, clearing session timers'); // Debugging
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    }

    // Cleanup timers on component unmount
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [user]); // Restart timer when user changes

    // Optional: Add event listeners for user activity to reset the timer
    useEffect(() => {
        const handleActivity = () => {
            if (user && user.id && !isModalOpen) { // Only reset if user is logged in and modal is not open
                resetSessionTimer();
            }
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
        };
    }, [user, isModalOpen]); // Re-attach listeners if user or modal state changes

  return (
    <AppContext.Provider value={{ user }}>
      {children}
      <SessionWarningModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onExtendSession={handleExtendSession}
        onLogout={handleLogout}
      />
    </AppContext.Provider>
  );
}

export function useAuth() {
  return useContext(AppContext);
}
