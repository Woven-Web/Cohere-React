
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CustomInstruction } from '@/lib/supabase';

interface TestUrlPatternModalProps {
  open: boolean;
  onClose: () => void;
  instruction?: CustomInstruction;
}

const TestUrlPatternModal: React.FC<TestUrlPatternModalProps> = ({ 
  open, 
  onClose,
  instruction 
}) => {
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<boolean | null>(null);

  const testPattern = () => {
    if (!testUrl || !instruction) return;
    
    // Convert the wildcard pattern to a regex pattern
    const pattern = instruction.url_pattern
      .replace(/\./g, '\\.')  // Escape dots
      .replace(/\*/g, '.*');  // Convert wildcards to regex wildcard
    
    const regex = new RegExp(`^${pattern}$`);
    const matches = regex.test(testUrl);
    
    setTestResult(matches);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestUrl(e.target.value);
    setTestResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Test URL Pattern</DialogTitle>
          <DialogDescription>
            Test if a URL matches the pattern: 
            {instruction && <Badge className="ml-2">{instruction.url_pattern}</Badge>}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="test-url">Enter URL to test</Label>
            <Input
              id="test-url"
              value={testUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/event/123"
              type="url"
            />
          </div>
          
          {testResult !== null && (
            <div className={`p-3 rounded-md ${testResult ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <p className="font-medium">
                {testResult 
                  ? '✅ URL matches the pattern!' 
                  : '❌ URL does not match the pattern.'}
              </p>
              <p className="text-sm mt-1">
                {testResult 
                  ? 'This URL would use this custom instruction.' 
                  : 'This URL would not use this custom instruction.'}
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={testPattern} disabled={!testUrl}>
            Test Pattern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TestUrlPatternModal;
