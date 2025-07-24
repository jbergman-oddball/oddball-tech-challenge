"use client";

import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateChallengeDialog } from '@/components/create-challenge-dialog';
// import { SidebarTrigger } from '@/components/ui/sidebar'; // Removed
import { useAuth } from '@/context/app-context';
import { clearSession } from '@/lib/actions';
import { useRouter, usePathname } from 'next/navigation'; // Import usePathname
import Link from 'next/link';
import { cn } from '@/lib/utils'; // Assuming cn utility exists for conditional classnames

export default function Header() {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname(); // Get current pathname

    const handleLogout = async () => {
        await clearSession();
        router.push('/login');
    }

     const navLinks = [
        { href: '/', label: 'Home' }, // Assuming '/' is your home page
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/profile', label: 'Profile' },
        { href: '/challenges-dashboard', label: 'Challenges' },
        // Add other top-level navigation links here
     ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <div className="flex items-center gap-4">
        {/* Add your logo or site title here */}
        <span className="font-headline text-lg font-bold">Oddball Tech Challenge</span>
        {/* Top Navigation Links */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === link.href ? "text-foreground" : "text-foreground/60"
            )}>
                {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
        <CreateChallengeDialog />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Interviewer</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'Loading...'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
             <Link href="/profile" passHref>
                <DropdownMenuItem>Profile</DropdownMenuItem>
             </Link>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
