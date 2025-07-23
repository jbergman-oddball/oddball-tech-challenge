
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
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/context/app-context';
import { clearSession } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
    const { user } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await clearSession();
        router.push('/login');
    }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <div className="flex items-center gap-2">
         <SidebarTrigger className="md:hidden"/>
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
