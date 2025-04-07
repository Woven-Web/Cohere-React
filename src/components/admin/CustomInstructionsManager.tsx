
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomInstruction } from '@/lib/supabase';
import InstructionForm from './instructions/InstructionForm';
import InstructionsList from './instructions/InstructionsList';
import TestUrlPatternModal from './instructions/TestUrlPatternModal';

const initialFormState = {
  url_pattern: '',
  use_playwright: false,
  instructions_text: '',
  priority: 0,
  is_active: true
};

const CustomInstructionsManager = () => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedInstruction, setSelectedInstruction] = useState<CustomInstruction | undefined>(undefined);

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

  const handleFormChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const openTestModal = (instruction: CustomInstruction) => {
    setSelectedInstruction(instruction);
    setTestModalOpen(true);
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
        <InstructionForm
          editingId={editingId}
          formData={formData}
          onCancel={resetForm}
          onFormChange={handleFormChange}
        />
      )}

      {!isAddingNew && instructions && (
        <InstructionsList 
          instructions={instructions} 
          onEdit={startEditing}
          onTestPattern={openTestModal}
        />
      )}

      <TestUrlPatternModal
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        instruction={selectedInstruction}
      />
    </div>
  );
};

export default CustomInstructionsManager;
