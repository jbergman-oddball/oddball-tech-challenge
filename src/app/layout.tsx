import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AppProvider } from '@/context/app-context';

export const metadata: Metadata = {
  title: 'CodeAlchemist',
  description: 'The ultimate tech challenge system.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The user object is now initialized to null on the server.
  // The client-side Firebase Auth state will determine the actual user.
  const user = null; 

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
            {children}
            <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
