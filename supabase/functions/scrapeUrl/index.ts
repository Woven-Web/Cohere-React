
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client using service role key (for bypassing RLS)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Verify JWT and get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user role to verify permissions
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found', details: profileError?.message }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user role has scraping permissions
    if (!['submitter', 'curator', 'admin'].includes(userProfile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to scrape URLs' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get URL from request body
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Missing URL parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find matching custom instruction
    const { data: customInstructions } = await supabaseClient
      .from('custom_instructions')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });
    
    // Find the first matching instruction based on URL pattern
    let matchedInstruction = null;
    if (customInstructions) {
      for (const instruction of customInstructions) {
        try {
          const pattern = new RegExp(instruction.url_pattern);
          if (pattern.test(url)) {
            matchedInstruction = instruction;
            break;
          }
        } catch (e) {
          console.error(`Invalid regex pattern in custom instruction: ${instruction.url_pattern}`);
        }
      }
    }

    // Determine parameters for Python API
    const usePlaywright = matchedInstruction?.use_playwright || false;
    const customInstructionsText = matchedInstruction?.instructions_text || null;
    const customInstructionId = matchedInstruction?.id || null;

    // Set up payload for the Python API
    const pythonApiPayload = {
      url: url,
      gemini_api_key: Deno.env.get('GEMINI_API_KEY') || '',
      use_playwright: usePlaywright,
      custom_instructions_text: customInstructionsText
    };

    let rawResponse;
    let parsedEventData = null;
    let errorMessage = null;

    try {
      // Make request to Python API
      const pythonApiUrl = Deno.env.get('PYTHON_API_URL') || '';
      console.log(`Calling Python API at ${pythonApiUrl}`);
      
      const apiResponse = await fetch(pythonApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pythonApiPayload)
      });

      // Read raw response as text first to ensure we can capture it
      const responseText = await apiResponse.text();
      console.log(`Python API response status: ${apiResponse.status}`);
      
      try {
        // Attempt to parse the response as JSON
        rawResponse = JSON.parse(responseText);
      } catch (e) {
        // If parsing fails, store as string
        rawResponse = responseText;
      }

      if (apiResponse.ok) {
        if (typeof rawResponse === 'object' && 
            rawResponse !== null && 
            'title' in rawResponse) {
          parsedEventData = rawResponse;
        } else {
          errorMessage = "Invalid response format from scraper API";
        }
      } else {
        if (typeof rawResponse === 'object' && 
            rawResponse !== null && 
            'error' in rawResponse) {
          errorMessage = `API Error: ${rawResponse.error}. ${rawResponse.details || ''}`;
        } else {
          errorMessage = `API Error (${apiResponse.status}): ${responseText}`;
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      errorMessage = `Failed to fetch from Python API: ${error.message}`;
      rawResponse = error.toString();
    }

    // Log the scrape attempt
    const { data: scrapeLog, error: logError } = await supabaseClient
      .from('scrape_logs')
      .insert({
        requested_by_user_id: user.id,
        url_scraped: url,
        custom_instruction_id_used: customInstructionId,
        playwright_flag_used: usePlaywright,
        raw_llm_response: rawResponse,
        parsed_event_data: parsedEventData,
        is_reported_bad: false,
        error_message: errorMessage
      })
      .select()
      .single();

    if (logError) {
      console.error("Error logging scrape attempt:", logError);
    }

    // Return response to client
    if (parsedEventData) {
      return new Response(
        JSON.stringify({
          scrape_log_id: scrapeLog?.id,
          data: parsedEventData
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          scrape_log_id: scrapeLog?.id,
          error: "Failed to scrape event details.",
          details: errorMessage
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
