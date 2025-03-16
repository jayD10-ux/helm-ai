
declare namespace gemini {
  interface GeminiResponse {
    text: string;
    finishReason?: string;
    type?: "text" | "widget_creation";
    widget?: WidgetData;
    message?: string;
    error?: string;
  }

  interface GeminiErrorResponse {
    error: string;
    details?: any;
  }

  interface WidgetData {
    name: string;
    description: string;
    type: string;
    config: Record<string, any>;
    code?: string;
    sandboxId?: string;
    previewUrl?: string;
  }
}
