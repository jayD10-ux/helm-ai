
declare namespace puter {
  namespace ai {
    interface ChatResponse {
      message: {
        content: Array<{
          text: string;
          type: string;
        }>;
      };
    }

    interface StreamResponse {
      text?: string;
    }

    function chat(
      prompt: string, 
      options?: {
        model?: string;
        stream?: boolean;
        systemPrompt?: string;
      }
    ): Promise<ChatResponse> | AsyncIterable<StreamResponse>;
  }

  function print(text: string): void;
}
