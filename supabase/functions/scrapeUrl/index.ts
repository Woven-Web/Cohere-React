
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    // Get auth token from request
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create supabase client with auth context
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user info from auth token
    const token = authorization.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has necessary role (submitter, curator, or admin)
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Error fetching user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const role = profile.role;
    if (!['submitter', 'curator', 'admin'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Requires submitter role or higher.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { url } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get custom instructions for this URL
    const { data: matchingInstructions } = await supabaseClient
      .from('custom_instructions')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });
    
    let customInstructionId = null;
    let usePlaywright = false;
    let customInstructionsText = null;

    if (matchingInstructions && matchingInstructions.length > 0) {
      // Find the first matching instruction based on URL pattern
      for (const instruction of matchingInstructions) {
        const pattern = instruction.url_pattern;
        if (url.includes(pattern)) {
          customInstructionId = instruction.id;
          usePlaywright = instruction.use_playwright;
          customInstructionsText = instruction.instructions_text;
          break;
        }
      }
    }

    // Get the Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare Python API payload
    const pythonApiUrl = Deno.env.get('PYTHON_API_URL');
    if (!pythonApiUrl) {
      return new Response(
        JSON.stringify({ error: 'Python API URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct payload for Python API
    const apiPayload = {
      url: url,
      gemini_api_key: geminiApiKey,
      use_playwright: usePlaywright,
      custom_instructions_text: customInstructionsText,
      model: "gemini-2.0-flash-lite" // Using the specified model
    };

    // Call the Python API
    console.log(`Sending request to Python API: ${pythonApiUrl}`);
    
    try {
      const response = await fetch(pythonApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      // Process the response
      const responseText = await response.text();
      let rawLlmResponse = null;
      let parsedEventData = null;
      let errorMessage = null;

      console.log(`Python API response status: ${response.status}`);
      
      if (response.ok) {
        try {
          rawLlmResponse = JSON.parse(responseText);
          console.log(`Python API response body: ${JSON.stringify(rawLlmResponse, null, 2)}`);
          
          // Check if the response has the expected structure
          if (rawLlmResponse.title && 
              (rawLlmResponse.description !== undefined) && 
              (rawLlmResponse.start_datetime !== undefined)) {
            parsedEventData = rawLlmResponse;
          } else {
            errorMessage = "Python API returned success but with unexpected data structure";
            console.error(errorMessage);
            console.error("Response:", JSON.stringify(rawLlmResponse));
          }
        } catch (e) {
          errorMessage = `Failed to parse Python API response: ${e.message}`;
          console.error(errorMessage);
          console.error("Raw response:", responseText);
        }
      } else {
        // Try to parse error response
        try {
          const errorResponse = JSON.parse(responseText);
          errorMessage = errorResponse.error || errorResponse.details || `API Error: ${response.status}`;
          console.error(`Python API error: ${errorMessage}`);
        } catch (e) {
          errorMessage = `API Error: ${response.status} - ${responseText.substring(0, 200)}`;
          console.error(errorMessage);
        }
      }

      // Log the scrape attempt
      const { data: scrapeLog, error: logError } = await supabaseClient
        .from('scrape_logs')
        .insert({
          requested_by_user_id: user.id,
          url_scraped: url,
          custom_instruction_id_used: customInstructionId,
          playwright_flag_used: usePlaywright,
          raw_llm_response: rawLlmResponse,
          parsed_event_data: parsedEventData,
          error_message: errorMessage,
          is_reported_bad: false
        })
        .select()
        .single();

      if (logError) {
        console.error('Error logging scrape attempt:', logError);
      }

      // Return the appropriate response to the client
      if (parsedEventData) {
        return new Response(
          JSON.stringify({
            scrape_log_id: scrapeLog?.id,
            data: parsedEventData
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({
            scrape_log_id: scrapeLog?.id,
            error: 'Failed to scrape event details.',
            details: errorMessage
          }),
          { 
            status: 422,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } catch (fetchError) {
      console.error('Error fetching from Python API:', fetchError);
      
      // Log the scrape attempt with the fetch error
      const { data: scrapeLog, error: logError } = await supabaseClient
        .from('scrape_logs')
        .insert({
          requested_by_user_id: user.id,
          url_scraped: url,
          custom_instruction_id_used: customInstructionId,
          playwright_flag_used: usePlaywright,
          raw_llm_response: null,
          parsed_event_data: null,
          error_message: `Failed to connect to Python API: ${fetchError.message}`,
          is_reported_bad: false
        })
        .select()
        .single();

      if (logError) {
        console.error('Error logging scrape attempt:', logError);
      }

      return new Response(
        JSON.stringify({
          scrape_log_id: scrapeLog?.id,
          error: 'Failed to scrape event details.',
          details: `Connection to Python API failed: ${fetchError.message}`
        }),
        { 
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Unhandled error in scrapeUrl function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
