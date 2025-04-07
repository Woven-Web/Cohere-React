
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CustomInstruction } from '@/lib/supabase';

interface InstructionFormProps {
  editingId: string | null;
  formData: {
    url_pattern: string;
    use_playwright: boolean;
    instructions_text: string;
    priority: number;
    is_active: boolean;
  };
  onCancel: () => void;
  onFormChange: (field: string, value: any) => void;
}

const InstructionForm: React.FC<InstructionFormProps> = ({ 
  editingId, 
  formData, 
  onCancel,
  onFormChange 
}) => {
  const queryClient = useQueryClient();

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
      onCancel();
    },
    onError: (error: any) => {
      toast.error('Failed to save custom instruction', {
        description: error.message
      });
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onFormChange(name, value);
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    onFormChange(name, checked);
  };

  const handleNumberChange = (name: string, value: string) => {
    onFormChange(name, parseInt(value) || 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertInstructionMutation.mutate(editingId 
      ? { ...formData, id: editingId } 
      : formData
    );
  };

  return (
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
        <Button variant="outline" onClick={onCancel}>
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
  );
};

export default InstructionForm;
