
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Edit, Trash2, TestTube } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CustomInstruction } from '@/lib/supabase';

interface InstructionsListProps {
  instructions: CustomInstruction[];
  onEdit: (instruction: CustomInstruction) => void;
  onTestPattern: (instruction: CustomInstruction) => void;
}

const InstructionsList: React.FC<InstructionsListProps> = ({ 
  instructions, 
  onEdit,
  onTestPattern
}) => {
  const queryClient = useQueryClient();

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

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ id, is_active: !currentStatus });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this instruction?')) {
      deleteInstructionMutation.mutate(id);
    }
  };

  return (
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
        {instructions && instructions.length > 0 ? (
          instructions.map((instruction) => (
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
                    onClick={() => onTestPattern(instruction)}
                    title="Test URL pattern"
                  >
                    <TestTube className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEdit(instruction)}
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
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
              No custom instructions have been created yet
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default InstructionsList;
