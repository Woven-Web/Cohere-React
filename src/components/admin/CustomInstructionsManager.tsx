
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlusCircle, Edit, Trash2, Save, X, Loader2 } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CustomInstruction } from '@/lib/supabase';

const initialFormState = {
  url_pattern: '',
  use_playwright: false,
  instructions_text: '',
  priority: 0,
  is_active: true
};

const CustomInstructionsManager = () => {
  const queryClient = useQueryClient();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormState);

  // Query for custom instructions
  const { data: instructions, isLoading, error } = useQuery({
    queryKey: ['customInstructions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_instructions')
        .select('*')
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Mutation for adding/updating custom instructions
  const upsertInstructionMutation = useMutation({
    mutationFn: async (instruction: Partial<CustomInstruction>) => {
      if (instruction.id) {
        // Update existing
        const { data, error } = await supabase
          .from('custom_instructions')
          .update({
            url_pattern: instruction.url_pattern,
            use_playwright: instruction.use_playwright,
            instructions_text: instruction.instructions_text,
            priority: instruction.priority,
            is_active: instruction.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', instruction.id)
          .select();
        
        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('custom_instructions')
          .insert({
            url_pattern: instruction.url_pattern,
            use_playwright: instruction.use_playwright || false,
            instructions_text: instruction.instructions_text,
            priority: instruction.priority || 0,
            is_active: instruction.is_active !== undefined ? instruction.is_active : true
          })
          .select();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customInstructions'] });
      toast.success('Custom instruction saved successfully');
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Failed to save custom instruction', {
        description: error.message
      });
    }
  });

  // Mutation for deleting custom instructions
  const deleteInstructionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('custom_instructions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customInstructions'] });
      toast.success('Custom instruction deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete custom instruction', {
        description: error.message
      });
    }
  });

  // Mutation for toggling active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      const { error } = await supabase
        .from('custom_instructions')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      return { id, is_active };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customInstructions'] });
      toast.success(`Instruction ${data.is_active ? 'activated' : 'deactivated'}`);
    },
    onError: (error: any) => {
      toast.error('Failed to update status', {
        description: error.message
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleNumberChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertInstructionMutation.mutate(editingId 
      ? { ...formData, id: editingId } 
      : formData
    );
  };

  const startEditing = (instruction: CustomInstruction) => {
    setFormData({
      url_pattern: instruction.url_pattern,
      use_playwright: instruction.use_playwright,
      instructions_text: instruction.instructions_text || '',
      priority: instruction.priority,
      is_active: instruction.is_active
    });
    setEditingId(instruction.id);
    setIsAddingNew(true);
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setIsAddingNew(false);
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ id, is_active: !currentStatus });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this instruction?')) {
      deleteInstructionMutation.mutate(id);
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
        <p className="font-medium">Error loading custom instructions</p>
        <p className="text-sm mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!isAddingNew ? (
        <div className="flex justify-end">
          <Button onClick={() => setIsAddingNew(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Instruction
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit' : 'Add'} Custom Instruction</CardTitle>
            <CardDescription>
              Configure site-specific scraping rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url_pattern">URL Pattern</Label>
                <Input
                  id="url_pattern"
                  name="url_pattern"
                  value={formData.url_pattern}
                  onChange={handleInputChange}
                  placeholder="e.g., eventbrite.com/*"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use * as a wildcard character. Pattern is matched against the full URL.
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="use_playwright"
                  checked={formData.use_playwright}
                  onCheckedChange={(checked) => handleSwitchChange('use_playwright', checked)}
                />
                <Label htmlFor="use_playwright">Use Playwright</Label>
                <span className="text-xs text-muted-foreground ml-2">
                  Enable for JavaScript-heavy sites that need browser rendering
                </span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  name="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => handleNumberChange('priority', e.target.value)}
                  min="0"
                  max="100"
                />
                <p className="text-xs text-muted-foreground">
                  Higher priority rules are matched first when multiple patterns match
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleSwitchChange('is_active', checked)}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instructions_text">Custom Instructions</Label>
                <Textarea
                  id="instructions_text"
                  name="instructions_text"
                  value={formData.instructions_text}
                  onChange={handleInputChange}
                  placeholder="Additional instructions to help the AI parse this site..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Special instructions for the AI when scraping URLs matching this pattern
                </p>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={upsertInstructionMutation.isPending || !formData.url_pattern}
            >
              {upsertInstructionMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Instruction
            </Button>
          </CardFooter>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>URL Pattern</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Features</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {instructions && instructions.map((instruction: CustomInstruction) => (
            <TableRow key={instruction.id}>
              <TableCell className="font-medium">{instruction.url_pattern}</TableCell>
              <TableCell>{instruction.priority}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {instruction.use_playwright && (
                    <Badge variant="secondary">Playwright</Badge>
                  )}
                  {instruction.instructions_text && (
                    <Badge variant="outline">Custom Text</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Switch
                  checked={instruction.is_active}
                  onCheckedChange={() => handleToggleActive(instruction.id, instruction.is_active)}
                  disabled={toggleActiveMutation.isPending}
                />
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => startEditing(instruction)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(instruction.id)}
                    disabled={deleteInstructionMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}

          {instructions && instructions.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No custom instructions have been created yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CustomInstructionsManager;
