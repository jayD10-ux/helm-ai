
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Playground } from "https://esm.sh/@e2b/sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, language = "javascript" } = await req.json();
    
    if (!code) {
      return new Response(
        JSON.stringify({ error: "Code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Executing ${language} code with e2b`);

    // Get API key from environment variables
    const apiKey = Deno.env.get("E2B_API_KEY");
    
    if (!apiKey) {
      console.error("E2B_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "E2B API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize e2b playground with the appropriate template
    const playground = await Playground.create({
      apiKey,
      template: getTemplateForLanguage(language),
    });

    let stdout = "";
    let stderr = "";
    
    try {
      // Execute the code differently based on language
      if (language === "javascript" || language === "typescript") {
        // For JavaScript/TypeScript, use Node.js
        const process = await playground.process.start({
          cmd: "node",
          args: ["-e", code],
        });

        // Capture stdout and stderr
        process.stdout.on("data", (data) => {
          stdout += data;
        });

        process.stderr.on("data", (data) => {
          stderr += data;
        });

        // Wait for process to finish
        const exitCode = await process.wait();
        console.log(`Process exited with code ${exitCode}`);
      } else if (language === "python") {
        // For Python, use python3
        const process = await playground.process.start({
          cmd: "python3",
          args: ["-c", code],
        });

        process.stdout.on("data", (data) => {
          stdout += data;
        });

        process.stderr.on("data", (data) => {
          stderr += data;
        });

        const exitCode = await process.wait();
        console.log(`Process exited with code ${exitCode}`);
      } else {
        // For other languages, write code to file and use appropriate command
        const filename = getFilenameForLanguage(language);
        
        // Write code to file
        await playground.filesystem.write(filename, code);

        // Execute the code
        const process = await playground.process.start({
          cmd: getCommandForLanguage(language),
          args: [filename],
        });

        process.stdout.on("data", (data) => {
          stdout += data;
        });

        process.stderr.on("data", (data) => {
          stderr += data;
        });

        const exitCode = await process.wait();
        console.log(`Process exited with code ${exitCode}`);
      }

      // Close the playground
      await playground.close();

      return new Response(
        JSON.stringify({
          stdout,
          stderr,
          isError: !!stderr
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (execError) {
      console.error("Execution error:", execError);
      
      // Make sure to close the playground even if there's an error
      try {
        await playground.close();
      } catch (closeError) {
        console.error("Error closing playground:", closeError);
      }

      return new Response(
        JSON.stringify({
          stdout,
          stderr: execError instanceof Error ? execError.message : "Unknown execution error",
          isError: true
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  } catch (error) {
    console.error("Error in code-execution function:", error);
    
    return new Response(
      JSON.stringify({ 
        stdout: "",
        stderr: error instanceof Error ? error.message : "Unknown error occurred",
        isError: true 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

// Helper functions
function getTemplateForLanguage(language: string): string {
  switch (language.toLowerCase()) {
    case "javascript":
    case "typescript":
      return "node";
    case "python":
      return "python";
    case "rust":
      return "rust";
    case "go":
      return "go";
    default:
      return "base"; // Fallback to base template
  }
}

function getFilenameForLanguage(language: string): string {
  switch (language.toLowerCase()) {
    case "javascript":
      return "code.js";
    case "typescript":
      return "code.ts";
    case "python":
      return "code.py";
    case "rust":
      return "code.rs";
    case "go":
      return "code.go";
    case "c":
      return "code.c";
    case "cpp":
    case "c++":
      return "code.cpp";
    default:
      return "code.txt";
  }
}

function getCommandForLanguage(language: string): string {
  switch (language.toLowerCase()) {
    case "javascript":
      return "node";
    case "typescript":
      return "ts-node";
    case "python":
      return "python3";
    case "rust":
      return "rustc";
    case "go":
      return "go run";
    case "c":
      return "gcc";
    case "cpp":
    case "c++":
      return "g++";
    default:
      return "cat"; // Fallback to just showing the file content
  }
}
