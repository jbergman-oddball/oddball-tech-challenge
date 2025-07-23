
"use client";

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
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import Header from "@/components/header";
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
           <div className="flex items-center gap-2 p-2">
                <Code className="h-7 w-7 text-primary" />
                <span className="font-headline text-xl font-bold">CodeAlchemist</span>
            </div>
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarMenuItem>
                        <Link href="/dashboard" passHref>
                            <SidebarMenuButton isActive={isActive('/dashboard')} tooltip={{children: 'Home'}}>
                                <Home/>
                                <span>Home</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <Link href="/reporting" passHref>
                            <SidebarMenuButton isActive={isActive('/reporting')} tooltip={{children: 'Reporting'}}>
                                <BarChart2/>
                                <span>Reporting</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>Management</SidebarGroupLabel>
                    <SidebarMenuItem>
                       <Link href="/users" passHref>
                            <SidebarMenuButton isActive={isActive('/users')} tooltip={{children: 'Users'}}>
                                <Users/>
                                <span>Users</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                       <Link href="/challenges-dashboard" passHref>
                            <SidebarMenuButton isActive={isActive('/challenges-dashboard')} tooltip={{children: 'Challenges'}}>
                                <FileText/>
                                <span>Challenges</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/candidates" passHref>
                            <SidebarMenuButton isActive={isActive('/candidates')} tooltip={{children: 'Candidates'}}>
                                <Briefcase/>
                                <span>Candidates</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <Link href="/interviewers" passHref>
                            <SidebarMenuButton isActive={isActive('/interviewers')} tooltip={{children: 'Interviewers'}}>
                                <UserCheck/>
                                <span>Interviewers</span>
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                </SidebarGroup>
            </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
             <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip={{children: 'Settings'}}>
                        <Settings/>
                        <span>Settings</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip={{children: 'Help'}}>
                        <HelpCircle/>
                        <span>Help</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
