'use client';

import { useEffect, useState } from 'react';
import type { UserProfile } from '@/types';
import { getAllUsers, approveUser } from '@/lib/actions'; // Assuming these actions exist
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
import { Loader2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusVariantMap: { [key in UserProfile['status']]: 'default' | 'secondary' | 'outline' | 'destructive' } = {
    'pending-approval': 'outline',
    active: 'default',
    suspended: 'destructive',
};

const roleVariantMap: { [key in UserProfile['role']]: 'default' | 'secondary' | 'outline' | 'default'} = {
    pending: 'outline',
    user: 'secondary',
    admin: 'default',
    interviewer: 'default', // Added interviewer role
    candidate: 'secondary', // Added candidate role
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'candidate' }); // Default role
  const [isAddingUser, setIsAddingUser] = useState(false);
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
      setUsers(users.map(u => u.uid === uid ? { ...u, status: 'active', role: 'user' } : u)); // Note: Role set to 'user' after approval, might need adjustment based on your logic
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

  const handleAddUser = async () => {
      setIsAddingUser(true);
      // **TODO: Implement backend logic to add user**
      // This is a placeholder. You will need to call your backend API here.
      console.log('Adding new user:', newUser);
      toast({
          title: 'Add User',
          description: 'User addition functionality is not yet fully implemented.',
      });
      setNewUser({ name: '', email: '', role: 'candidate' }); // Clear form
      setIsAddingUser(false);
  }

  // **TODO: Implement Edit and Delete User functions**
  const handleEditUser = (uid: string) => {
      console.log('Edit user:', uid);
      toast({
          title: 'Edit User',
          description: `Edit functionality for user ${uid} is not yet implemented.`,
      });
  }

   const handleDeleteUser = (uid: string) => {
      console.log('Delete user:', uid);
       toast({
          title: 'Delete User',
          description: `Delete functionality for user ${uid} is not yet fully implemented.`,
      });
  }

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

      {/* Add User Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
          <CardDescription>Fill in the details to add a new user.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value as 'candidate' | 'interviewer' | 'admin' })}> {/* Added 'as' for type assertion */}
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="candidate">Candidate</SelectItem>
                  <SelectItem value="interviewer">Interviewer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAddUser} disabled={isAddingUser || !newUser.name || !newUser.email} className="mt-4">
              {isAddingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add User
          </Button>
        </CardContent>
      </Card>

      {/* User List Table */}
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
                        className="mr-2"
                      >
                        {isApproving === user.uid && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Approve
                      </Button>
                    )}
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditUser(user.uid)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteUser(user.uid)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
