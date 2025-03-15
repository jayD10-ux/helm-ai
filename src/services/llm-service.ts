
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
  sandboxId?: string;
  previewUrl?: string;
}

export const sendChatMessage = async (message: ChatMessage): Promise<LLMResponse> => {
  try {
    console.log(`Sending message to LLM: "${message.content}"`);
    
    const response = await supabase.functions.invoke('llm-chat', {
      body: { 
        message: message.content, 
        chatId: message.chatId 
      },
    });

    console.log('LLM response:', response.data);
    
    // Handle error in the response
    if (response.error) {
      throw new Error(response.error.message || 'An error occurred while processing your request');
    }
    
    return response.data;
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
