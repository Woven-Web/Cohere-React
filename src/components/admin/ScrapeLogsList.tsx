
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ScrapeLog } from '@/lib/supabase-client';
import { formatDistanceToNow } from 'date-fns';
import { Check, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const ScrapeLogsList = () => {
  const [selectedLog, setSelectedLog] = useState<ScrapeLog | null>(null);

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['scrape-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scrape_logs')
        .select(`
          *,
          user_profiles:requested_by_user_id(role),
          custom_instructions:custom_instruction_id_used(url_pattern)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (ScrapeLog & { 
        user_profiles: { role: string }; 
        custom_instructions: { url_pattern: string } | null;
      })[];
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading scrape logs...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800 mb-4">
        <h3 className="font-bold">Error loading scrape logs</h3>
        <p>{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Instructions Used</TableHead>
              <TableHead>Playwright</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs && logs.length > 0 ? (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true }) : 'Unknown'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">{log.url_scraped}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{log.url_scraped}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    {log.error_message ? (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Failed
                      </Badge>
                    ) : log.is_reported_bad ? (
                      <Badge variant="outline" className="flex items-center gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100">
                        <AlertTriangle className="h-3 w-3" />
                        Reported
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-100">
                        <Check className="h-3 w-3" />
                        Success
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.custom_instructions?.url_pattern ? (
                      <Badge variant="secondary" className="max-w-[150px] truncate">
                        {log.custom_instructions.url_pattern}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.playwright_flag_used ? (
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Yes</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedLog(log)}
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Scrape Log Details</DialogTitle>
                          </DialogHeader>
                          {selectedLog && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">URL Scraped</h3>
                                <a 
                                  href={selectedLog.url_scraped} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  Open URL <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                              <div className="p-2 bg-muted rounded-md">
                                <code className="break-all text-xs">{selectedLog.url_scraped}</code>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h3 className="text-sm font-medium mb-1">Created</h3>
                                  <p className="text-sm">
                                    {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : 'Unknown'}
                                  </p>
                                </div>
                                <div>
                                  <h3 className="text-sm font-medium mb-1">Status</h3>
                                  <p className="text-sm">
                                    {selectedLog.error_message ? 'Failed' : 
                                     selectedLog.is_reported_bad ? 'Reported as Bad' : 'Success'}
                                  </p>
                                </div>
                              </div>
                              
                              {selectedLog.error_message && (
                                <div>
                                  <h3 className="text-sm font-medium mb-1">Error Message</h3>
                                  <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-red-800 text-sm">{selectedLog.error_message}</p>
                                  </div>
                                </div>
                              )}
                              
                              {selectedLog.raw_llm_response && (
                                <div>
                                  <h3 className="text-sm font-medium mb-1">Raw LLM Response</h3>
                                  <div className="p-2 bg-muted rounded-md overflow-auto max-h-60">
                                    <pre className="text-xs">{JSON.stringify(selectedLog.raw_llm_response, null, 2)}</pre>
                                  </div>
                                </div>
                              )}
                              
                              {selectedLog.parsed_event_data && (
                                <div>
                                  <h3 className="text-sm font-medium mb-1">Parsed Event Data</h3>
                                  <div className="p-2 bg-muted rounded-md overflow-auto max-h-60">
                                    <pre className="text-xs">{JSON.stringify(selectedLog.parsed_event_data, null, 2)}</pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <a 
                        href={log.url_scraped} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  No scrape logs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ScrapeLogsList;
