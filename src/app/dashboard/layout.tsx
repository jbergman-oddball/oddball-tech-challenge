"use client";

import React from 'react';
// Removed sidebar imports as they are now in root layout
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import {
//   Home,
//   Users,
//   Briefcase,
//   FileText,
//   UserCheck,
//   BarChart2,
//   Settings,
//   HelpCircle,
//   Code,
// } from "lucide-react";

import Header from "@/components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Removed pathname and isActive as they are handled in root layout
  // const pathname = usePathname();
  // const isActive = (path: string) => {
  //   return pathname === path;
  // };

  return (
    // Removed main layout container and sidebar as they are now in root layout
    // <div className="flex flex-row-reverse h-screen">
      {/* Main Content - Header is now part of the main content */}
      // <main className="flex-1 p-4 overflow-y-auto">
        {/* Header is now in root layout */}
         {/* <Header /> */}
        {children}
      // </main>

      {/* Removed Sidebar */}
      // <div className="flex flex-col w-64 bg-gray-800 text-white">
      //   <div className="flex items-center gap-2 p-4 border-b border-gray-700">
      //       <Code className="h-7 w-7 text-primary" />
      //       <span className="font-headline text-xl font-bold">Oddball Tech Challenge</span>
      //   </div>
      //   <nav className="flex flex-col p-2">
      //     <Link href="/dashboard" className={`flex items-center gap-2 p-2 rounded ${isActive('/dashboard') ? 'bg-gray-700' : ''}`}>
      //       <Home size={20} />
      //       Dashboard
      //     </Link>
      //     {/* Other sidebar links */}
      //   </nav>
      // </div>
    // </div>
     <div>{children}</div> // Minimal content for dashboard layout
  );
}
