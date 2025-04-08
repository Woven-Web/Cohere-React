import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Check, Loader2, User } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { UserProfile } from '@/lib/supabase';

interface UserWithEmail extends UserProfile {
  email?: string;
}

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, string>>({});

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['userProfiles'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (profilesError) throw profilesError;
      
      const usersWithEmails = profiles as UserWithEmail[];
      return usersWithEmails;
    }
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', userId);
      
      if (error) throw error;
      return { userId, role };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
      setPendingUpdates((prev) => {
        const newState = { ...prev };
        delete newState[data.userId];
        return newState;
      });
      toast.success('User role updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update user role', {
        description: error.message
      });
    }
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    setPendingUpdates((prev) => ({
      ...prev,
      [userId]: newRole
    }));
  };

  const saveRoleChange = (userId: string) => {
    const newRole = pendingUpdates[userId];
    if (newRole) {
      updateUserRoleMutation.mutate({ userId, role: newRole });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <p className="font-medium">Error loading users</p>
        <p className="text-sm mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="hidden sm:table-cell">Last Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users && users.map((user: UserWithEmail) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex flex-col">
                  {user.email ? (
                    <span className="font-medium">{user.email}</span>
                  ) : (
                    <span className="text-muted-foreground text-sm">Email not available</span>
                  )}
                  <span className="text-xs text-muted-foreground font-mono truncate max-w-[150px] sm:max-w-[200px]">{user.id}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Badge 
                    variant={
                      user.role === 'admin' 
                        ? 'destructive' 
                        : user.role === 'curator' 
                          ? 'default' 
                          : user.role === 'submitter' 
                            ? 'secondary' 
                            : 'outline'
                    }
                    className="inline-flex"
                  >
                    {user.role}
                  </Badge>
                  
                  <Select
                    value={pendingUpdates[user.id] || user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                  >
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Change role..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="submitter">Submitter</SelectItem>
                      <SelectItem value="curator">Curator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">{new Date(user.updated_at).toLocaleString()}</TableCell>
              <TableCell>
                {pendingUpdates[user.id] && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => saveRoleChange(user.id)}
                    disabled={updateUserRoleMutation.isPending && updateUserRoleMutation.variables?.userId === user.id}
                    className="w-full sm:w-auto"
                  >
                    {updateUserRoleMutation.isPending && updateUserRoleMutation.variables?.userId === user.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    Save
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserManagement;
