'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/header';
import { Mail, User, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const [user, loading] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
            ...data,
            createdAt: data.createdAt.toDate(),
        } as UserProfile);
      } else {
        console.log('No such document!');
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [user, loading, router]);

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-3xl">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-5 w-64" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Separator />
                <div className="space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-5 w-2/3" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-5 w-2/3" />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return <div>User profile not found.</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
        <Header/>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
            <div className="mx-auto max-w-3xl">
            <Card>
                <CardHeader>
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={user?.photoURL || ''} alt={profile.name} />
                            <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-3xl font-headline">{profile.name}</CardTitle>
                            <CardDescription className="text-lg text-muted-foreground">{profile.email}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <Separator />
                    <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Role:</span>
                        <Badge variant="secondary">{profile.role}</Badge>
                    </div>
                     <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Status:</span>
                        <Badge variant={profile.status === 'active' ? 'default' : 'destructive'}>{profile.status}</Badge>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Member since:</span>
                        <span className="text-muted-foreground">{profile.createdAt.toLocaleDateString()}</span>
                    </div>
                    <Button>Edit Profile</Button>
                </CardContent>
            </Card>
            </div>
        </main>
    </div>
  );
}
