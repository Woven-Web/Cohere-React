
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Happening, ScrapeLog, CustomInstruction, UserProfile } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import EventCard from '@/components/events/EventCard';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Info, AlertTriangle, Pencil, Loader2, UserPlus, Filter } from 'lucide-react';
import { format } from 'date-fns';

const Admin = () => {
  const { user, isCurator, isAdmin, refreshProfile } = useAuth();
  const [pendingEvents, setPendingEvents] = useState<Happening[]>([]);
  const [scrapeLogsList, setScrapeLogsList] = useState<ScrapeLog[]>([]);
  const [customInstructions, setCustomInstructions] = useState<CustomInstruction[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrapeLogsLoading, setScrapeLogsLoading] = useState(false);
  const [instructionsLoading, setInstructionsLoading] = useState(false);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [showBadLogs, setShowBadLogs] = useState(false);
  const [newInstruction, setNewInstruction] = useState<{
    url_pattern: string;
    instructions_text: string;
    use_playwright: boolean;
    priority: number;
    is_active: boolean;
  }>({
    url_pattern: '',
    instructions_text: '',
    use_playwright: false,
    priority: 0,
    is_active: true
  });
  const [editingInstruction, setEditingInstruction] = useState<CustomInstruction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (isCurator) {
      fetchPendingEvents();
    }
  }, [isCurator]);

  const fetchPendingEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('happenings')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingEvents(data || []);
    } catch (error) {
      console.error('Error fetching pending events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScrapeLogsList = async () => {
    setScrapeLogsLoading(true);
    try {
      let query = supabase
        .from('scrape_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (showBadLogs) {
        query = query.eq('is_reported_bad', true);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      setScrapeLogsList(data || []);
    } catch (error) {
      console.error('Error fetching scrape logs:', error);
      toast.error('Failed to load scrape logs');
    } finally {
      setScrapeLogsLoading(false);
    }
  };

  const fetchCustomInstructions = async () => {
    setInstructionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_instructions')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      setCustomInstructions(data || []);
    } catch (error) {
      console.error('Error fetching custom instructions:', error);
      toast.error('Failed to load custom instructions');
    } finally {
      setInstructionsLoading(false);
    }
  };

  const fetchUserProfiles = async () => {
    if (!isAdmin) return;
    
    setProfilesLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setUserProfiles(data || []);
    } catch (error) {
      console.error('Error fetching user profiles:', error);
      toast.error('Failed to load user profiles');
    } finally {
      setProfilesLoading(false);
    }
  };

  const updateEventStatus = async (eventId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('happenings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', eventId);

      if (error) throw error;

      // Update local state
      setPendingEvents(prev => prev.filter(event => event.id !== eventId));
      
      toast.success(
        status === 'approved' 
          ? 'Event approved successfully' 
          : 'Event rejected successfully'
      );
    } catch (error: any) {
      console.error('Error updating event status:', error);
      toast.error('Failed to update event status', {
        description: error.message
      });
    }
  };

  const handleTabChange = (value: string) => {
    if (value === 'logs' && scrapeLogsList.length === 0) {
      fetchScrapeLogsList();
    } else if (value === 'settings' && customInstructions.length === 0) {
      fetchCustomInstructions();
      if (isAdmin) {
        fetchUserProfiles();
      }
    }
  };

  const addNewInstruction = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_instructions')
        .insert([newInstruction])
        .select();

      if (error) throw error;
      
      setCustomInstructions(prev => [...prev, data[0]]);
      setNewInstruction({
        url_pattern: '',
        instructions_text: '',
        use_playwright: false,
        priority: 0,
        is_active: true
      });
      
      toast.success('Custom instruction added successfully');
    } catch (error: any) {
      console.error('Error adding custom instruction:', error);
      toast.error('Failed to add custom instruction', {
        description: error.message
      });
    }
  };

  const toggleInstructionStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('custom_instructions')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setCustomInstructions(prev => 
        prev.map(instruction => 
          instruction.id === id 
            ? { ...instruction, is_active: !isActive } 
            : instruction
        )
      );
      
      toast.success(`Instruction ${!isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Error toggling instruction status:', error);
      toast.error('Failed to update instruction', {
        description: error.message
      });
    }
  };

  const handleEditInstruction = (instruction: CustomInstruction) => {
    setEditingInstruction(instruction);
    setEditDialogOpen(true);
  };

  const saveEditedInstruction = async () => {
    if (!editingInstruction) return;
    
    try {
      const { error } = await supabase
        .from('custom_instructions')
        .update({ 
          url_pattern: editingInstruction.url_pattern,
          instructions_text: editingInstruction.instructions_text,
          use_playwright: editingInstruction.use_playwright,
          priority: editingInstruction.priority,
          is_active: editingInstruction.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingInstruction.id);

      if (error) throw error;

      // Update local state
      setCustomInstructions(prev => 
        prev.map(instruction => 
          instruction.id === editingInstruction.id 
            ? editingInstruction 
            : instruction
        )
      );
      
      setEditDialogOpen(false);
      setEditingInstruction(null);
      toast.success('Instruction updated successfully');
    } catch (error: any) {
      console.error('Error updating instruction:', error);
      toast.error('Failed to update instruction', {
        description: error.message
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: 'basic' | 'submitter' | 'curator' | 'admin') => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUserProfiles(prev => 
        prev.map(profile => 
          profile.id === userId 
            ? { ...profile, role: newRole } 
            : profile
        )
      );
      
      // If the current user's role was updated, refresh their profile
      if (userId === user?.id) {
        await refreshProfile();
      }
      
      toast.success('User role updated successfully');
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role', {
        description: error.message
      });
    }
  };

  if (!isCurator) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-muted-foreground">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage community events and settings
        </p>
      </div>

      <Tabs defaultValue="pending" onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending Events</TabsTrigger>
          <TabsTrigger value="logs">Scrape Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Events</CardTitle>
              <CardDescription>
                Review and approve community-submitted events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : pendingEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pending events to review
                </div>
              ) : (
                <div className="space-y-6">
                  {pendingEvents.map(event => (
                    <div key={event.id} className="border-b pb-6 last:border-0">
                      <EventCard event={event} showAttendButton={false} />
                      <div className="flex justify-end space-x-3 mt-4">
                        <Button 
                          variant="outline" 
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => updateEventStatus(event.id, 'rejected')}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => updateEventStatus(event.id, 'approved')}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Scrape Logs</CardTitle>
                  <CardDescription>
                    View logs of URL scraping attempts
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="show-bad-logs" className="text-sm">Show reported logs only</Label>
                  <Switch 
                    id="show-bad-logs" 
                    checked={showBadLogs} 
                    onCheckedChange={(checked) => {
                      setShowBadLogs(checked);
                      fetchScrapeLogsList();
                    }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {scrapeLogsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : scrapeLogsList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No scrape logs found
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Playwright Used</TableHead>
                        <TableHead>Reported</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scrapeLogsList.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm')}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            <a 
                              href={log.url_scraped} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {log.url_scraped}
                            </a>
                          </TableCell>
                          <TableCell>
                            {log.error_message ? (
                              <Badge variant="destructive">Failed</Badge>
                            ) : log.parsed_event_data ? (
                              <Badge variant="success" className="bg-green-600">Success</Badge>
                            ) : (
                              <Badge variant="outline">Partial</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.playwright_flag_used ? (
                              <Badge className="bg-purple-600">Yes</Badge>
                            ) : (
                              <Badge variant="outline">No</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.is_reported_bad ? (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Reported
                              </Badge>
                            ) : (
                              <Badge variant="outline">No</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="grid gap-6">
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>Custom Instructions</CardTitle>
                  <CardDescription>
                    Manage scraping instructions for specific website patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {instructionsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <div className="rounded-md border mb-6">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Pattern</TableHead>
                              <TableHead>Priority</TableHead>
                              <TableHead>Use Playwright</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customInstructions.map((instruction) => (
                              <TableRow key={instruction.id}>
                                <TableCell className="font-medium">
                                  {instruction.url_pattern}
                                </TableCell>
                                <TableCell>{instruction.priority}</TableCell>
                                <TableCell>
                                  {instruction.use_playwright ? (
                                    <Badge className="bg-purple-600">Yes</Badge>
                                  ) : (
                                    <Badge variant="outline">No</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {instruction.is_active ? (
                                    <Badge className="bg-green-600">Active</Badge>
                                  ) : (
                                    <Badge variant="outline">Inactive</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditInstruction(instruction)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant={instruction.is_active ? "destructive" : "outline"}
                                      size="sm"
                                      onClick={() => toggleInstructionStatus(instruction.id, instruction.is_active)}
                                    >
                                      {instruction.is_active ? 'Deactivate' : 'Activate'}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="space-y-4 border-t pt-6">
                        <h3 className="text-lg font-medium">Add New Instruction</h3>
                        <div className="grid gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="url_pattern">URL Pattern</Label>
                              <Input
                                id="url_pattern"
                                placeholder="e.g., *.eventbrite.com/*"
                                value={newInstruction.url_pattern}
                                onChange={(e) => setNewInstruction({ ...newInstruction, url_pattern: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="priority">Priority</Label>
                              <Input
                                id="priority"
                                type="number"
                                value={newInstruction.priority}
                                onChange={(e) => setNewInstruction({ ...newInstruction, priority: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="instructions_text">Instructions</Label>
                            <Textarea
                              id="instructions_text"
                              placeholder="Special instructions for scraping this type of site..."
                              value={newInstruction.instructions_text || ''}
                              onChange={(e) => setNewInstruction({ ...newInstruction, instructions_text: e.target.value })}
                              rows={4}
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="use_playwright"
                              checked={newInstruction.use_playwright}
                              onCheckedChange={(checked) => setNewInstruction({ ...newInstruction, use_playwright: checked })}
                            />
                            <Label htmlFor="use_playwright">Use Playwright (for JavaScript-heavy sites)</Label>
                          </div>

                          <Button
                            onClick={addNewInstruction}
                            disabled={!newInstruction.url_pattern}
                          >
                            Add Instruction
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage user roles and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profilesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : userProfiles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User ID</TableHead>
                            <TableHead>Current Role</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userProfiles.map((profile) => (
                            <TableRow key={profile.id}>
                              <TableCell className="font-medium">
                                {profile.id}
                              </TableCell>
                              <TableCell>
                                <Badge className={`
                                  ${profile.role === 'admin' ? 'bg-red-600' : ''}
                                  ${profile.role === 'curator' ? 'bg-blue-600' : ''}
                                  ${profile.role === 'submitter' ? 'bg-yellow-600' : ''}
                                  ${profile.role === 'basic' ? 'bg-gray-500' : ''}
                                `}>
                                  {profile.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(profile.updated_at), 'yyyy-MM-dd HH:mm')}
                              </TableCell>
                              <TableCell>
                                <Select
                                  defaultValue={profile.role}
                                  onValueChange={(value) => updateUserRole(
                                    profile.id, 
                                    value as 'basic' | 'submitter' | 'curator' | 'admin'
                                  )}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Change role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      <SelectLabel>Roles</SelectLabel>
                                      <SelectItem value="basic">Basic</SelectItem>
                                      <SelectItem value="submitter">Submitter</SelectItem>
                                      <SelectItem value="curator">Curator</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Instruction Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Custom Instruction</DialogTitle>
            <DialogDescription>
              Update the settings for this scraping instruction.
            </DialogDescription>
          </DialogHeader>
          
          {editingInstruction && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-url-pattern" className="text-right">URL Pattern</Label>
                <Input
                  id="edit-url-pattern"
                  value={editingInstruction.url_pattern}
                  onChange={(e) => setEditingInstruction({
                    ...editingInstruction,
                    url_pattern: e.target.value
                  })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-priority" className="text-right">Priority</Label>
                <Input
                  id="edit-priority"
                  type="number"
                  value={editingInstruction.priority}
                  onChange={(e) => setEditingInstruction({
                    ...editingInstruction,
                    priority: parseInt(e.target.value) || 0
                  })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-instructions" className="text-right">Instructions</Label>
                <Textarea
                  id="edit-instructions"
                  value={editingInstruction.instructions_text || ''}
                  onChange={(e) => setEditingInstruction({
                    ...editingInstruction,
                    instructions_text: e.target.value
                  })}
                  className="col-span-3"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Use Playwright</Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch
                    id="edit-use-playwright"
                    checked={editingInstruction.use_playwright}
                    onCheckedChange={(checked) => setEditingInstruction({
                      ...editingInstruction,
                      use_playwright: checked
                    })}
                  />
                  <Label htmlFor="edit-use-playwright">Enable for JavaScript-heavy sites</Label>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch
                    id="edit-is-active"
                    checked={editingInstruction.is_active}
                    onCheckedChange={(checked) => setEditingInstruction({
                      ...editingInstruction,
                      is_active: checked
                    })}
                  />
                  <Label htmlFor="edit-is-active">Active</Label>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveEditedInstruction}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
