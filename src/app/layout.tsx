"use client";

// Removed metadata import
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AppProvider } from '@/context/app-context';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Briefcase,
  FileText,
  UserCheck,
  BarChart2,
  Settings,
  HelpCircle,
  Code,
} from "lucide-react";

import Header from "@/components/header";

// Removed metadata export
// export const metadata: Metadata = {
//   title: 'Oddball Tech Challenge',
//   description: 'The ultimate tech challenge system.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The user object is now initialized to null on the server.
  // The client-side Firebase Auth state will determine the actual user.
  const user = null; 

  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppProvider user={user}>
           <div className="flex flex-col h-screen"> {/* Use flex-col for overall layout */}
              {/* Header at the top */}
              <Header />
               <div className="flex flex-1 flex-row h-full"> {/* Flex row for sidebar and main content */}
                    {/* Sidebar */}
                    <div className="flex flex-col w-64 bg-gray-800 text-white">
                        <div className="flex items-center gap-2 p-4 border-b border-gray-700">
                            <Code className="h-7 w-7 text-primary" />
                            <span className="font-headline text-xl font-bold">Oddball Tech Challenge</span>
                        </div>
                        <nav className="flex flex-col p-2">
                        <Link href="/dashboard" className={`flex items-center gap-2 p-2 rounded ${isActive('/dashboard') ? 'bg-gray-700' : ''}`}>
                            <Home size={20} />
                            Dashboard
                        </Link>
                        <Link href="/reporting" className={`flex items-center gap-2 p-2 rounded ${isActive('/reporting') ? 'bg-gray-700' : ''}`}>
                                <BarChart2 size={20} />
                                Reporting
                        </Link>
                        <div className="mt-4 mb-2 text-xs font-semibold text-gray-400">Management</div>
                        <Link href="/users" className={`flex items-center gap-2 p-2 rounded ${isActive('/users') ? 'bg-gray-700' : ''}`}>
                                <Users size={20} />
                                Users
                        </Link>
                        <Link href="/challenges-dashboard" className={`flex items-center gap-2 p-2 rounded ${isActive('/challenges-dashboard') ? 'bg-gray-700' : ''}`}>
                                <FileText size={20} />
                                Challenges
                        </Link>
                        <Link href="/candidates" className={`flex items-center gap-2 p-2 rounded ${isActive('/candidates') ? 'bg-gray-700' : ''}`}>
                                <Briefcase size={20} />
                                Candidates
                        </Link>
                        <Link href="/interviewers" className={`flex items-center gap-2 p-2 rounded ${isActive('/interviewers') ? 'bg-gray-700' : ''}`}>
                                <UserCheck size={20} />
                                Interviewers
                        </Link>
                        <div className="mt-4 mb-2 text-xs font-semibold text-gray-400">Settings & Help</div>
                        <Link href="/settings" className={`flex items-center gap-2 p-2 rounded ${isActive('/settings') ? 'bg-gray-700' : ''}`}>
                                <Settings size={20} />
                                Settings
                        </Link>
                        <Link href="/help" className={`flex items-center gap-2 p-2 rounded ${isActive('/help') ? 'bg-gray-700' : ''}`}>
                                <HelpCircle size={20} />
                                Help
                        </Link>
                        </nav>
                    </div>
                    {/* Main Content */}
                    <main className="flex-1 p-4 overflow-y-auto">
                        {children}
                    </main>
               </div>
            </div>
            <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
