
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface CodeExecutionResult {
  stdout: string;
  stderr: string;
  isError: boolean;
}

/**
 * Executes code in a sandboxed environment using e2b via Supabase Edge Function
 */
export const executeCode = async (
  code: string,
  language: string = "javascript"
): Promise<CodeExecutionResult> => {
  try {
    console.log(`Executing ${language} code with e2b`);
    
    const { data, error } = await supabase.functions.invoke("code-execution", {
      body: {
        code,
        language
      }
    });

    if (error) {
      console.error("Error executing code:", error);
      toast.error("Failed to execute code");
      return {
        stdout: "",
        stderr: `Error: ${error.message}`,
        isError: true
      };
    }

    console.log("Code execution result:", data);
    
    return {
      stdout: data.stdout || "",
      stderr: data.stderr || "",
      isError: !!data.isError
    };
  } catch (error) {
    console.error("Error in e2b service:", error);
    toast.error("Error executing code");
    
    return {
      stdout: "",
      stderr: error instanceof Error ? error.message : "Unknown error occurred",
      isError: true
    };
  }
};
