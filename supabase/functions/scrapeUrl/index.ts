
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing Authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get environment variables
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('EDGE_SERVICE_ROLE_KEY');
  const pythonApiUrl = Deno.env.get('PYTHON_API_URL');
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

  if (!supabaseUrl || !serviceRoleKey || !pythonApiUrl || !geminiApiKey) {
    console.error('Missing required environment variables');
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse request body
    const { url } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get user ID from JWT
    const jwtToken = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwtToken);

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has appropriate role (submitter, curator, or admin)
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve user profile', details: profileError?.message }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const role = userProfile.role;
    if (!['submitter', 'curator', 'admin'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions', details: 'User role does not have permission to scrape URLs' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find custom instruction for the URL
    const { data: customInstructions, error: instructionsError } = await supabase
      .from('custom_instructions')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (instructionsError) {
      console.error('Instructions error:', instructionsError);
    }

    // Find the matching custom instruction
    let matchedInstruction = null;
    if (customInstructions && customInstructions.length > 0) {
      for (const instruction of customInstructions) {
        try {
          const pattern = new RegExp(instruction.url_pattern);
          if (pattern.test(url)) {
            matchedInstruction = instruction;
            break;
          }
        } catch (e) {
          console.error(`Invalid regex pattern in custom_instruction (id: ${instruction.id}):`, e);
        }
      }
    }

    // Determine parameters for the Python API
    const usePlaywright = matchedInstruction?.use_playwright || false;
    const customInstructionsText = matchedInstruction?.instructions_text || null;
    const customInstructionIdUsed = matchedInstruction?.id || null;

    console.log(`Scraping URL: ${url} with playwright: ${usePlaywright}`);
    console.log(`Custom instruction ID: ${customInstructionIdUsed}`);

    // Prepare payload for Python API
    const pythonApiPayload = {
      url,
      gemini_api_key: geminiApiKey,
      use_playwright: usePlaywright,
      custom_instructions_text: customInstructionsText
    };

    // Call Python API
    console.log(`Calling Python API at: ${pythonApiUrl}`);
    const pythonApiResponse = await fetch(pythonApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pythonApiPayload)
    });

    // Read response as text first to ensure we capture the raw response
    const responseText = await pythonApiResponse.text();
    
    let rawLlmResponse = null;
    let parsedEventData = null;
    let errorMessage = null;

    // Try to parse the response as JSON
    try {
      rawLlmResponse = JSON.parse(responseText);
      
      // Check if the parsed response contains expected event data fields
      if (rawLlmResponse && 
          (rawLlmResponse.title || 
           rawLlmResponse.description || 
           rawLlmResponse.start_datetime || 
           rawLlmResponse.end_datetime || 
           rawLlmResponse.location)) {
        parsedEventData = rawLlmResponse;
      } else if (rawLlmResponse && rawLlmResponse.error) {
        // Handle error format from Python API
        errorMessage = `${rawLlmResponse.error}: ${rawLlmResponse.details || ''}`;
      }
    } catch (e) {
      console.error('Failed to parse Python API response as JSON:', e);
      rawLlmResponse = responseText;
      errorMessage = `Failed to parse response: ${pythonApiResponse.status} ${pythonApiResponse.statusText}`;
    }

    if (!pythonApiResponse.ok && !errorMessage) {
      errorMessage = `API returned status ${pythonApiResponse.status}: ${pythonApiResponse.statusText}`;
    }

    // Log the attempt to the scrape_logs table
    const { data: scrapeLog, error: logError } = await supabase
      .from('scrape_logs')
      .insert({
        requested_by_user_id: user.id,
        url_scraped: url,
        custom_instruction_id_used: customInstructionIdUsed,
        playwright_flag_used: usePlaywright,
        raw_llm_response: rawLlmResponse,
        parsed_event_data: parsedEventData,
        error_message: errorMessage,
        is_reported_bad: false
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to log scrape attempt:', logError);
      return new Response(
        JSON.stringify({ error: 'Failed to log scrape attempt', details: logError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return appropriate response based on the scrape result
    if (parsedEventData) {
      return new Response(
        JSON.stringify({
          scrape_log_id: scrapeLog.id,
          data: parsedEventData
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          scrape_log_id: scrapeLog.id,
          error: 'Failed to scrape event details',
          details: errorMessage || 'Unknown error'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
