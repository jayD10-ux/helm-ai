
declare namespace gemini {
  interface GeminiResponse {
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

  interface GeminiErrorResponse {
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

  interface GeminiRequestOptions {
    contents: {
      parts: {
        text: string;
      }[];
    }[];
    generationConfig?: {
      temperature?: number;
      topP?: number;
      topK?: number;
      maxOutputTokens?: number;
      stopSequences?: string[];
    };
    safetySettings?: {
      category: string;
      threshold: string;
    }[];
  }

  interface GeminiChatPayload {
    content: string;
    isWidgetRequest: boolean;
    systemPrompt?: string;
    debugMode?: boolean;
  }
}
