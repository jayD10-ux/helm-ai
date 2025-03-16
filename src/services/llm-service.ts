
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
    console.log(`Sending message to Gemini 2.0 Flash: "${message.content}"`);
    
    // Check if this is a widget creation request
    const isWidgetRequest = detectWidgetCreationIntent(message.content);
    
    // Create appropriate system prompt based on the request type
    let systemPrompt = "You are a helpful AI assistant called Helm AI. You provide concise, accurate information.";
    
    if (isWidgetRequest) {
      const now = new Date();
      const currentDateTime = now.toLocaleString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
      
      systemPrompt = `You are an advanced AI that generates fully functional UI widgets based on user requests. 
      These widgets should:
      1. Be built using React + shadcn/ui.
      2. Include necessary interactivity like sorting, filtering, search, and user input handling.
      3. If an API call is required, assume it will use an Express.js backend (/api/get-data, /api/send-data).
      4. Be self-contained and ready for execution in a sandbox environment.
      5. Follow best practices for clean, modular code.
      6. Always start the component with "export default function Widget() {".
      7. DO NOT include imports for shadcn/ui components (assume they're globally available).
      8. Use standard HTML elements with Tailwind CSS classes for styling.
      9. Include realistic placeholder data for demonstration.
      10. Handle all core functionality with built-in React hooks.
      
      Today's date is ${currentDateTime}.
      
      CRITICAL: NEVER suggest or mention external APIs, services, or tools like Notion, Google Sheets, 
      or any other external service UNLESS the user EXPLICITLY mentions them in their request.
      Do not create false dependencies on external services that weren't requested.
      
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
          },
          "code": "// React component code here"
        },
        "message": "I've created a widget called Widget Name. This widget does X. You can view it in the Widgets page."
      }

      DO NOT include any explanations, markdown formatting, or any text outside of this JSON structure. The entire response must be valid JSON.`;
    }
    
    try {
      console.log("Calling Gemini API via Supabase Edge Function");
      
      // Call Gemini 2.0 Flash via Supabase Edge Function
      const { data: geminiResponse, error } = await supabase.functions.invoke("gemini-chat", {
        body: {
          content: message.content,
          isWidgetRequest,
          systemPrompt
        }
      });
      
      if (error) {
        console.error('Error with Gemini API invocation:', error);
        toast.error("Failed to connect to Gemini API");
        throw new Error(`Supabase edge function error: ${error.message}`);
      }
      
      console.log('Gemini raw response:', geminiResponse);
      
      if (!geminiResponse) {
        console.error('Empty response from Gemini API');
        toast.error("Received empty response from Gemini API");
        throw new Error("Empty response from Gemini API");
      }
      
      if (geminiResponse.error) {
        console.error('Gemini API returned an error:', geminiResponse.error);
        toast.error("Gemini API error: " + geminiResponse.error);
        throw new Error(`Gemini API error: ${geminiResponse.error}`);
      }
      
      if (!geminiResponse.text) {
        console.error('Missing text in Gemini response:', geminiResponse);
        toast.error("Invalid response format from Gemini API");
        throw new Error("Invalid response from Gemini API: missing text");
      }
      
      // Process the response based on whether it's a widget creation request or not
      if (isWidgetRequest) {
        try {
          // For widget requests, check if we already have a parsed widget
          if (geminiResponse.type === "widget_creation" && geminiResponse.widget) {
            console.log('Successfully received widget response:', geminiResponse);
            // Save the widget and return the response
            const widgetId = await createWidget(geminiResponse.widget);
            return geminiResponse;
          }
          
          // If we have rawOutput flag, the edge function couldn't parse the JSON
          if (geminiResponse.rawOutput) {
            console.log('Received raw output, attempting to extract widget data');
            
            // Try to extract JSON with regex (fallback)
            const responseText = geminiResponse.text;
            console.log('Response text for widget creation:', responseText.substring(0, 200) + '...');
            
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/);
            
            if (jsonMatch) {
              try {
                const extractedJson = jsonMatch[1] || jsonMatch[0];
                console.log('Extracted JSON with regex:', extractedJson.substring(0, 200) + '...');
                const parsedResponse = JSON.parse(extractedJson);
                
                if (parsedResponse.type === "widget_creation" && parsedResponse.widget) {
                  console.log('Successfully parsed widget response with regex extraction:', parsedResponse);
                  // Save the widget and return the response
                  const widgetId = await createWidget(parsedResponse.widget);
                  return parsedResponse;
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
            message: "I tried to create a widget based on your request, but encountered an error parsing the response. Please try again with more specific details."
          };
        } catch (error) {
          console.error("Error processing widget response:", error);
          
          // If widget parsing fails, return a text response explaining the issue
          return {
            type: "text",
            message: "I tried to create a widget based on your request, but encountered an error. Please try again with more specific details about what kind of widget you'd like."
          };
        }
      } else {
        // For regular chat, just return the text response
        const responseText = geminiResponse.text;
        
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
      console.error('Error with Gemini integration:', error);
      toast.error("Error connecting to Gemini: " + error.message);
      
      // Return a user-friendly error message
      return {
        type: "text",
        message: "I'm having trouble connecting to Gemini right now. Please try again in a moment."
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
    
    // Create a new object without the code property to save to the database
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
