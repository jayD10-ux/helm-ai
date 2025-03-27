
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ChatMessage {
  content: string;
  chatId: string | null;
}

interface WidgetData {
  name: string;
  description: string;
  type: string;
  config: Record<string, any>;
  mcp_connections?: any[];
  code?: string;
}

interface LLMResponse {
  type: string;
  message: string;
  widget?: WidgetData;
}

export const sendChatMessage = async (message: ChatMessage): Promise<LLMResponse> => {
  try {
    console.log(`Sending message to OpenAI: "${message.content}"`);
    
    // Check if this is a widget creation request
    const isWidgetRequest = detectWidgetCreationIntent(message.content);
    
    // Create appropriate system prompt based on the request type
    let systemPrompt = "You are a helpful AI assistant called Helm AI. You provide concise, accurate information. Always include the current date in your responses when asked about time-sensitive information.";
    
    if (isWidgetRequest) {
      systemPrompt = `You are an advanced AI that generates fully functional UI widgets based on user requests. 
      These widgets should:
      1. Be built using React + shadcn/ui.
      2. Include necessary interactivity like sorting, filtering, search, and user input handling.
      3. If an API call is required, assume it will use an Express.js backend (/api/get-data, /api/send-data).
      4. Be self-contained and ready for execution in a sandbox environment.
      5. Follow best practices for clean, modular code.
      
      CRITICAL: NEVER suggest or mention external APIs, services, or tools unless the user EXPLICITLY mentions them.
      
      When creating a widget, respond with ONLY a JSON object in this exact format:
      {
        "type": "widget_creation",
        "widget": {
          "name": "Widget Name",
          "description": "What the widget does",
          "type": "custom",
          "config": {
            "dataSource": "custom",
            "refreshInterval": 300,
            "layout": "card"
          }
        },
        "message": "I've created a widget called Widget Name. This widget does X. You can view it in the Widgets page."
      }

      DO NOT include a 'code' field in the widget object as it will be added separately.
      DO NOT include any explanations, markdown formatting, or any text outside of this JSON structure.`;
    }
    
    // Check if debug mode is enabled from user settings
    let debugMode = false;
    try {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('debug_mode')
        .limit(1)
        .single();
      
      debugMode = settings?.debug_mode || false;
    } catch (settingsError) {
      console.log('Could not retrieve debug settings, defaulting to false');
    }
    
    // Get the model type from user settings
    let modelType = "gpt-4o-mini"; // Default model
    try {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('model_type')
        .limit(1)
        .single();
      
      modelType = settings?.model_type || "gpt-4o-mini";
    } catch (settingsError) {
      console.log('Could not retrieve model type settings, defaulting to gpt-4o-mini');
    }
    
    if (debugMode) {
      console.log('Debug mode enabled for OpenAI request');
      console.log('Using model:', modelType);
    }
    
    try {
      console.log("Calling OpenAI API via Supabase Edge Function");
      
      // Call OpenAI via Supabase Edge Function
      const { data: openaiResponse, error } = await supabase.functions.invoke("openai-chat", {
        body: {
          content: message.content,
          isWidgetRequest,
          systemPrompt,
          debugMode,
          modelType
        }
      });
      
      if (error) {
        console.error('Error with OpenAI API invocation:', error);
        toast.error("Failed to connect to OpenAI API");
        throw new Error(`Supabase edge function error: ${error.message}`);
      }
      
      console.log('OpenAI raw response:', openaiResponse);
      
      if (!openaiResponse) {
        console.error('Empty response from OpenAI API');
        toast.error("Received empty response from OpenAI API");
        throw new Error("Empty response from OpenAI API");
      }
      
      if (openaiResponse.error) {
        console.error('OpenAI API returned an error:', openaiResponse.error);
        if (openaiResponse.details) {
          console.error('Error details:', openaiResponse.details);
        }
        toast.error("OpenAI API error: " + openaiResponse.error);
        throw new Error(`OpenAI API error: ${openaiResponse.error}`);
      }
      
      if (!openaiResponse.text) {
        console.error('Missing text in OpenAI response:', openaiResponse);
        toast.error("Invalid response format from OpenAI API");
        throw new Error("Invalid response from OpenAI API: missing text");
      }
      
      // Process the response based on whether it's a widget creation request or not
      if (isWidgetRequest) {
        try {
          // For widget requests, check if we already have a parsed widget
          if (openaiResponse.type === "widget_creation" && openaiResponse.widget) {
            console.log('Successfully received widget response:', openaiResponse);
            
            // Extract code if present, but don't save it to the database
            const { code, ...widgetDataForDb } = openaiResponse.widget;
            
            // Save the widget without the code property
            const widgetId = await createWidget(widgetDataForDb);
            
            // Return the full response including code for frontend use
            return {
              type: "widget_creation",
              message: openaiResponse.message || "Widget created successfully!",
              widget: {
                ...widgetDataForDb,
                code: code
              }
            };
          }
          
          // If we have rawOutput flag, the edge function couldn't parse the JSON
          if (openaiResponse.rawOutput) {
            console.log('Received raw output, attempting to extract widget data');
            
            // Try to extract JSON with regex (fallback)
            const responseText = openaiResponse.text;
            console.log('Response text for widget creation:', responseText.substring(0, 200) + '...');
            
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
            
            if (jsonMatch) {
              try {
                const extractedJson = jsonMatch[1] || jsonMatch[0];
                console.log('Extracted JSON with regex:', extractedJson.substring(0, 200) + '...');
                const parsedResponse = JSON.parse(extractedJson);
                
                if (parsedResponse.type === "widget_creation" && parsedResponse.widget) {
                  console.log('Successfully parsed widget response with regex extraction:', parsedResponse);
                  
                  // Extract code if present, but don't save it to the database
                  const { code, ...widgetDataForDb } = parsedResponse.widget;
                  
                  // Save the widget without the code property
                  const widgetId = await createWidget(widgetDataForDb);
                  
                  // Return the full response including code for frontend use
                  return {
                    type: "widget_creation",
                    message: parsedResponse.message || "Widget created successfully!",
                    widget: {
                      ...widgetDataForDb,
                      code: code
                    }
                  };
                }
              } catch (regexParseError) {
                console.error('Regex JSON parsing failed:', regexParseError);
              }
            }
          }
          
          // If we couldn't parse a widget response, inform the user
          console.error('Failed to parse widget creation response');
          return {
            type: "text",
            message: "I tried to create a widget based on your request, but encountered an error. Please try again with more specific details."
          };
        } catch (error) {
          console.error("Error processing widget response:", error);
          
          // If widget parsing fails, return a text response explaining the issue
          return {
            type: "text",
            message: "I tried to create a widget based on your request, but encountered an error. Please try again with more specific details."
          };
        }
      } else {
        // For regular chat, just return the text response
        const responseText = openaiResponse.text;
        
        // Save the conversation to chat history if we have a chat ID
        if (message.chatId) {
          await supabase.from('messages').insert([{
            content: message.content,
            sender: 'user',
            chat_id: message.chatId,
            timestamp: new Date()
          }]);
          
          await supabase.from('messages').insert([{
            content: responseText,
            sender: 'ai',
            chat_id: message.chatId,
            timestamp: new Date()
          }]);
        }
        
        return {
          type: "text",
          message: responseText
        };
      }
    } catch (error) {
      console.error('Error with OpenAI integration:', error);
      toast.error("Error connecting to OpenAI: " + error.message);
      
      // Return a user-friendly error message
      return {
        type: "text",
        message: "I'm having trouble connecting to OpenAI right now. Please try again in a moment."
      };
    }
  } catch (error) {
    console.error('Error in LLM service:', error);
    toast.error("Error in LLM service: " + error.message);
    
    // Provide a more helpful error message
    return {
      type: "text",
      message: "I encountered an error while processing your request. Please try again."
    };
  }
};

export const createWidget = async (widgetData: WidgetData): Promise<string> => {
  try {
    console.log('Creating widget:', widgetData);
    
    // Ensure we don't try to save the code property to the database
    const { code, ...widgetDataForDb } = widgetData;
    
    const { data, error } = await supabase
      .from('widgets')
      .insert([widgetDataForDb])
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to create widget: No data returned');
    }

    return data[0].id;
  } catch (error) {
    console.error('Error creating widget:', error);
    throw error;
  }
};

export const getWidgetById = async (id: string): Promise<WidgetData> => {
  try {
    const { data, error } = await supabase
      .from('widgets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching widget:', error);
    throw error;
  }
};

export const detectWidgetCreationIntent = (message: string): boolean => {
  // Improved regex to better detect widget creation intent
  const widgetKeywords = [
    'create a widget',
    'build a widget',
    'make a widget',
    'generate a widget',
    'design a widget',
    'develop a widget',
    'new widget',
    'widget that',
    'widget to'
  ];
  
  const lowerMessage = message.toLowerCase();
  return widgetKeywords.some(keyword => lowerMessage.includes(keyword));
};
