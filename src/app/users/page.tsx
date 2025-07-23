'use client';

import { useEffect, useState } from 'react';
import type { UserProfile } from '@/types';
import { getAllUsers, approveUser } from '@/lib/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const statusVariantMap: { [key in UserProfile['status']]: 'default' | 'secondary' | 'outline' | 'destructive' } = {
    'pending-approval': 'outline',
    active: 'default',
    suspended: 'destructive',
};

const roleVariantMap: { [key in UserProfile['role']]: 'default' | 'secondary' | 'outline' } = {
    pending: 'outline',
    user: 'secondary',
    admin: 'default',
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching users',
          description: 'Could not load the list of users. Please try again later.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, [toast]);

  const handleApprove = async (uid: string) => {
    setIsApproving(uid);
    const result = await approveUser(uid);
    if (result.success) {
      setUsers(users.map(u => u.uid === uid ? { ...u, status: 'active', role: 'user' } : u));
      toast({
        title: 'User Approved',
        description: 'The user account has been successfully activated.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Approval Failed',
        description: result.error || 'An unexpected error occurred.',
      });
    }
    setIsApproving(null);
  };

  if (isLoading) {
    return (
        <div>
            <h1 className="text-3xl font-headline font-bold mb-6 text-foreground">User Management</h1>
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>Loading user data...</CardDescription>
                </CardHeader>
                <CardContent>
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-headline font-bold mb-6 text-foreground">User Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Approve, manage, and view all registered users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                   <TableCell>
                    <Badge variant={roleVariantMap[user.role]}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariantMap[user.status]}>{user.status}</Badge>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {user.status === 'pending-approval' && (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(user.uid)}
                        disabled={isApproving === user.uid}
                      >
                        {isApproving === user.uid && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Approve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}