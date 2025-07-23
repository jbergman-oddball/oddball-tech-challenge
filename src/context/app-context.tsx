
'use client';
import React, { createContext, useContext } from 'react';

type User = {
  id: string | null;
  email: string | null;
};

type AppContextType = {
  user: User | null;
};

const AppContext = createContext<AppContextType>({ user: null });

export function AppProvider({ children, user }: { children: React.ReactNode, user: User | null }) {
  return (
    <AppContext.Provider value={{ user }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAuth() {
  return useContext(AppContext);
}
