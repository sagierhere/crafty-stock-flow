import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  userManagementService,
  type CreateUserRequest,
  type UpdateUserRequest,
  type UserDetail,
} from '@/services/userManagement';
import { Roles } from '@/constants/roles';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const DEFAULT_FORM: CreateUserRequest = {
  userName: '',
  email: '',
  password: '',
  fullName: '',
  role: Roles.InventoryManager,
};

const ManageUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateUserRequest>(DEFAULT_FORM);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editForm, setEditForm] = useState<UpdateUserRequest | null>(null);

  const managersQuery = useQuery({
    queryKey: ['users', 'managers'],
    queryFn: userManagementService.getManagers,
  });

  const cashiersQuery = useQuery({
    queryKey: ['users', 'cashiers'],
    queryFn: userManagementService.getCashiers,
  });

  const detailQuery = useQuery<UserDetail | undefined>({
    queryKey: ['users', 'detail', selectedUserId],
    queryFn: () => userManagementService.getUserDetails(selectedUserId as string),
    enabled: isDetailOpen && Boolean(selectedUserId),
  });

  const createUserMutation = useMutation({
    mutationFn: userManagementService.createUser,
    onSuccess: (user) => {
      toast({
        title: 'User created',
        description: `${user.fullName ?? user.userName} was added as a ${formData.role === Roles.InventoryManager ? 'manager' : 'cashier'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['users', 'managers'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'cashiers'] });
      setFormData({ ...DEFAULT_FORM, role: formData.role });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to create user.';
      toast({
        title: 'Creation failed',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateUserRequest }) =>
      userManagementService.updateUser(userId, payload),
    onSuccess: (_, variables) => {
      toast({
        title: 'User updated',
        description: 'Account details were saved successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['users', 'managers'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'cashiers'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'detail', variables.userId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to update user.';
      toast({ title: 'Update failed', description: message, variant: 'destructive' });
    },
  });

  const lockUserMutation = useMutation({
    mutationFn: ({ userId, lockout }: { userId: string; lockout: boolean }) =>
      userManagementService.setUserLockout(userId, lockout),
    onSuccess: (_, variables) => {
      const locked = variables.lockout;
      toast({
        title: locked ? 'Account locked' : 'Account unlocked',
        description: locked ? 'The user can no longer sign in.' : 'The user can access the system again.',
      });
      queryClient.invalidateQueries({ queryKey: ['users', 'managers'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'cashiers'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'detail', variables.userId] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to change lockout state.';
      toast({ title: 'Lockout update failed', description: message, variant: 'destructive' });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => userManagementService.deleteUser(userId),
    onSuccess: (_, userId) => {
      toast({
        title: 'User deleted',
        description: 'The account and associated access were removed.',
      });
      queryClient.invalidateQueries({ queryKey: ['users', 'managers'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'cashiers'] });
      queryClient.removeQueries({ queryKey: ['users', 'detail', userId] });
      setIsDetailOpen(false);
      setSelectedUserId(null);
      setEditForm(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to delete user.';
      toast({ title: 'Deletion failed', description: message, variant: 'destructive' });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    createUserMutation.mutate(formData);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setIsDetailOpen(true);
  };

  const managedRoleFromDetail = (detail?: UserDetail): UpdateUserRequest['role'] =>
    detail?.roles.includes(Roles.InventoryManager) ? Roles.InventoryManager : Roles.Cashier;

  useEffect(() => {
    if (detailQuery.data) {
      setEditForm({
        email: detailQuery.data.email,
        fullName: detailQuery.data.fullName ?? '',
        role: managedRoleFromDetail(detailQuery.data),
      });
    }
  }, [detailQuery.data]);

  const handleSheetToggle = (open: boolean) => {
    setIsDetailOpen(open);
    if (!open) {
      setSelectedUserId(null);
      setEditForm(null);
    }
  };

  const handleUpdateUser = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUserId || !editForm) {
      return;
    }

    updateUserMutation.mutate({ userId: selectedUserId, payload: editForm });
  };

  const handleLockToggle = (lockout: boolean) => {
    if (!selectedUserId) {
      return;
    }

    lockUserMutation.mutate({ userId: selectedUserId, lockout });
  };

  const handleDeleteUser = () => {
    if (!selectedUserId) {
      return;
    }

    deleteUserMutation.mutate(selectedUserId);
  };

  const formatDateTime = (value?: string | null) =>
    value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  const isLoading = useMemo(
    () =>
      managersQuery.isLoading ||
      cashiersQuery.isLoading ||
      createUserMutation.isPending,
    [cashiersQuery.isLoading, createUserMutation.isPending, managersQuery.isLoading],
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Manage team members</h1>
          <p className="text-muted-foreground">
            Create Inventory Manager and Cashier accounts. Each user receives role-based access automatically.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add a new team member</CardTitle>
            <CardDescription>Assign the appropriate role so they see the correct dashboard when signing in.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userName">Username</Label>
                <Input
                  id="userName"
                  value={formData.userName}
                  onChange={(event) => setFormData({ ...formData, userName: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Temporary password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: typeof Roles.InventoryManager | typeof Roles.Cashier) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Roles.InventoryManager}>Inventory Manager</SelectItem>
                    <SelectItem value={Roles.Cashier}>Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? 'Creating user...' : 'Create user'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory managers</CardTitle>
              <CardDescription>People who can adjust stock levels and manage suppliers.</CardDescription>
            </CardHeader>
            <CardContent>
              {managersQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading managers...</p>
              ) : managersQuery.isError ? (
                <p className="text-sm text-destructive">Unable to load managers.</p>
              ) : managersQuery.data?.length ? (
                <ul className="space-y-2">
                  {managersQuery.data.map((manager) => (
                    <li key={manager.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectUser(manager.id)}
                        className="w-full text-left border border-border rounded-md px-4 py-3 transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{manager.fullName ?? manager.userName}</p>
                          <Badge variant="outline">View</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{manager.email}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No managers yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cashiers</CardTitle>
              <CardDescription>Staff who process orders and checkouts.</CardDescription>
            </CardHeader>
            <CardContent>
              {cashiersQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading cashiers...</p>
              ) : cashiersQuery.isError ? (
                <p className="text-sm text-destructive">Unable to load cashiers.</p>
              ) : cashiersQuery.data?.length ? (
                <ul className="space-y-2">
                  {cashiersQuery.data.map((cashier) => (
                    <li key={cashier.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectUser(cashier.id)}
                        className="w-full text-left border border-border rounded-md px-4 py-3 transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{cashier.fullName ?? cashier.userName}</p>
                          <Badge variant="outline">View</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{cashier.email}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No cashiers yet.</p>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">Click a user to review activity, edit details, or remove access.</p>
            </CardFooter>
          </Card>
        </div>
      </div>
      {isLoading && <span className="sr-only">Loading</span>}

      <Sheet open={isDetailOpen} onOpenChange={handleSheetToggle}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{detailQuery.data?.fullName ?? detailQuery.data?.userName ?? 'User details'}</SheetTitle>
            <SheetDescription>Review recent activity and manage access for this account.</SheetDescription>
          </SheetHeader>

          {detailQuery.isLoading ? (
            <p className="mt-6 text-sm text-muted-foreground">Loading user details...</p>
          ) : detailQuery.isError ? (
            <p className="mt-6 text-sm text-destructive">Unable to load user details.</p>
          ) : detailQuery.data && editForm ? (
            <div className="mt-6 space-y-8">
              <section className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {detailQuery.data.roles.map((role) => (
                    <Badge key={role} variant={role === Roles.InventoryManager ? 'default' : 'secondary'}>
                      {role}
                    </Badge>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Username: <span className="font-medium text-foreground">{detailQuery.data.userName}</span></p>
                  <p>Phone: {detailQuery.data.phoneNumber ?? '—'}</p>
                  <p>Lockout ends: {formatDateTime(detailQuery.data.lockoutEndUtc)}</p>
                </div>
              </section>

              <Separator />

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Account details</h3>
                  <p className="text-sm text-muted-foreground">Update contact information or adjust role assignments.</p>
                </div>
                <form className="space-y-4" onSubmit={handleUpdateUser}>
                  <div className="space-y-2">
                    <Label htmlFor="detail-fullName">Full name</Label>
                    <Input
                      id="detail-fullName"
                      value={editForm.fullName ?? ''}
                      onChange={(event) => setEditForm({ ...editForm, fullName: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="detail-email">Email</Label>
                    <Input
                      id="detail-email"
                      type="email"
                      value={editForm.email}
                      onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={editForm.role}
                      onValueChange={(value: UpdateUserRequest['role']) => setEditForm({ ...editForm, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Roles.InventoryManager}>Inventory Manager</SelectItem>
                        <SelectItem value={Roles.Cashier}>Cashier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateUserMutation.isPending}>
                      {updateUserMutation.isPending ? 'Saving...' : 'Save changes'}
                    </Button>
                  </div>
                </form>
              </section>

              <Separator />

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Access control</h3>
                  <p className="text-sm text-muted-foreground">Lock an account to prevent sign-ins temporarily.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={detailQuery.data.isLockedOut ? 'destructive' : 'secondary'}>
                    {detailQuery.data.isLockedOut ? 'Locked' : 'Active'}
                  </Badge>
                  {detailQuery.data.isLockedOut && detailQuery.data.lockoutEndUtc ? (
                    <span className="text-xs text-muted-foreground">
                      Until {formatDateTime(detailQuery.data.lockoutEndUtc)}
                    </span>
                  ) : null}
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleLockToggle(!detailQuery.data.isLockedOut)}
                  disabled={lockUserMutation.isPending}
                >
                  {lockUserMutation.isPending
                    ? 'Updating...'
                    : detailQuery.data.isLockedOut
                    ? 'Unlock account'
                    : 'Lock account'}
                </Button>
              </section>

              <Separator />

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Recent activity</h3>
                  <p className="text-sm text-muted-foreground">The last recorded actions for this account.</p>
                </div>
                {detailQuery.data.recentActivities.length ? (
                  <ScrollArea className="h-64 rounded-md border">
                    <div className="p-4 space-y-4">
                      {detailQuery.data.recentActivities.map((activity) => (
                        <div key={activity.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm font-medium text-foreground">
                            <span>{activity.activityType}</span>
                            <span className="text-xs text-muted-foreground">{formatDateTime(activity.occurredAtUtc)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
                )}
              </section>

              <Separator />

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
                  <p className="text-sm text-muted-foreground">Deleting an account immediately revokes access.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleteUserMutation.isPending}>
                      Delete account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this user?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. The user will lose access to the system immediately.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={deleteUserMutation.isPending}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteUser} disabled={deleteUserMutation.isPending}>
                        {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </section>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">Select a user to view more details.</p>
          )}

          <SheetFooter />
        </SheetContent>
      </Sheet>
    </Layout>
  );
};

export default ManageUsers;
