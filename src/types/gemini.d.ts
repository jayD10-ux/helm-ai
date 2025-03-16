
declare namespace gemini {
  interface GeminiResponse {
    text: string;
    finishReason?: string;
  }

  interface GeminiErrorResponse {
    error: string;
    details?: any;
  }
}
