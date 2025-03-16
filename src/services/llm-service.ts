
import { supabase } from "@/lib/supabase";

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
    console.log(`Sending message to Claude 3.5 Sonnet via Puter.js: "${message.content}"`);
    
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
      
      When creating a widget, respond with a JSON object in this exact format:
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

      ONLY INCLUDE THE REACT COMPONENT CODE IN THE 'code' FIELD. DO NOT INCLUDE ANY EXPLANATIONS OR MARKDOWN FORMATTING IN THE CODE.`;
    }
    
    // Call Claude 3.5 Sonnet via Puter.js with streaming disabled
    const response = await puter.ai.chat(message.content, {
      model: 'claude-3-5-sonnet',
      systemPrompt: systemPrompt,
      stream: false // Explicitly disable streaming
    }) as puter.ai.ChatResponse; // Use type assertion to handle the return type
    
    console.log('Claude 3.5 response:', response);
    
    // Process the response based on whether it's a widget creation request or not
    if (isWidgetRequest) {
      try {
        // For widget requests, try to parse the response as JSON
        const responseText = response.message.content[0].text;
        
        // Look for JSON structure in the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const parsedResponse = JSON.parse(jsonMatch[0]);
          
          if (parsedResponse.type === "widget_creation" && parsedResponse.widget) {
            // If it's a valid widget creation response, save it
            if (message.chatId) {
              // Save this interaction to chat history
              await supabase.from('messages').insert([{
                content: message.content,
                sender: 'user',
                chat_id: message.chatId,
                timestamp: new Date()
              }]);
              
              await supabase.from('messages').insert([{
                content: parsedResponse.message,
                sender: 'ai',
                chat_id: message.chatId,
                timestamp: new Date()
              }]);
            }
            
            return parsedResponse;
          }
        }
        
        // If we couldn't parse a widget response, fall through to the default handling
        throw new Error("Failed to parse widget creation response");
      } catch (error) {
        console.error("Error parsing widget response:", error);
        
        // If widget parsing fails, return a text response explaining the issue
        return {
          type: "text",
          message: "I tried to create a widget based on your request, but encountered an error. Please try again with more specific details about what kind of widget you'd like."
        };
      }
    } else {
      // For regular chat, extract the text response
      const responseText = response.message.content[0].text;
      
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
    console.error('Error in LLM service:', error);
    throw error;
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
