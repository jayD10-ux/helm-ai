
declare namespace openai {
  interface OpenAIResponse {
    text: string;
    finishReason?: string;
    type?: "text" | "widget_creation";
    widget?: WidgetData;
    message?: string;
    error?: string;
    rawOutput?: boolean;
    details?: any;
    status?: number;
  }

  interface OpenAIErrorResponse {
    error: string;
    text?: string;
    details?: any;
    status?: number;
  }

  interface WidgetData {
    name: string;
    description: string;
    type: string;
    config: Record<string, any>;
    code?: string;
    sandboxId?: string;
    previewUrl?: string;
    mcp_connections?: any[];
  }

  interface OpenAIRequestOptions {
    model: string;
    messages: {
      role: 'system' | 'user' | 'assistant';
      content: string;
    }[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    stop?: string[];
  }

  interface OpenAIChatPayload {
    content: string;
    isWidgetRequest: boolean;
    systemPrompt?: string;
    debugMode?: boolean;
    modelType?: string;
  }
}
