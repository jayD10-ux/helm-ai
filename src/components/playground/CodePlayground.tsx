
import { useState } from "react";
import { motion } from "framer-motion";
import { Terminal, Play, Save, Code, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fadeIn } from "@/components/ui/motion";
import { executeCode } from "@/services/e2b-service";
import { toast } from "sonner";

const CodePlayground = () => {
  const [code, setCode] = useState("// Type your code here\nconsole.log('Hello, Helm AI!');");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [language, setLanguage] = useState("javascript");
  const [isError, setIsError] = useState(false);
  
  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput(""); // Clear previous output
    setIsError(false);
    
    try {
      // Execute code using e2b service
      const result = await executeCode(code, language);
      
      let outputText = "";
      
      if (result.stdout) {
        outputText += result.stdout;
      }
      
      if (result.stderr) {
        outputText += (outputText ? "\n\n" : "") + "Errors:\n" + result.stderr;
      }
      
      setOutput(outputText || "No output");
      setIsError(result.isError);
      
      if (!result.isError) {
        toast.success("Code executed successfully");
      } else {
        toast.error("Code execution failed");
      }
    } catch (error) {
      console.error("Error running code:", error);
      setOutput(`Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`);
      setIsError(true);
      toast.error("Failed to execute code");
    } finally {
      setIsRunning(false);
    }
  };
  
  const handleSaveCode = () => {
    // Placeholder for save functionality
    console.log("Code saved:", code);
    toast.success("Code saved to your drafts");
    // Would implement actual save to database functionality here
  };
  
  return (
    <motion.div
      {...fadeIn}
      className="h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Code Playground</h1>
          <p className="text-muted-foreground">Write, test, and debug your code using E2B</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleSaveCode}
            className="bg-secondary/50"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            onClick={handleRunCode}
            disabled={isRunning}
            className={cn(
              isRunning && "opacity-80"
            )}
          >
            <Play className="h-4 w-4 mr-2" />
            {isRunning ? "Running..." : "Run Code"}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-16rem)]">
        <Card className="glass-morphism overflow-hidden">
          <Tabs defaultValue="code" className="w-full">
            <div className="flex items-center justify-between p-2 border-b border-border">
              <TabsList className="bg-secondary/30">
                <TabsTrigger value="code" className="data-[state=active]:bg-secondary">
                  <Code className="h-4 w-4 mr-2" />
                  Code Editor
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center">
                <span className="text-sm mr-2">Language:</span>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[140px] bg-secondary/30 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="go">Go</SelectItem>
                    <SelectItem value="rust">Rust</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <TabsContent value="code" className="p-0 m-0">
              <div className="w-full h-[calc(100vh-22rem)]">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-full bg-transparent p-4 font-mono text-sm focus:outline-none resize-none"
                  spellCheck={false}
                />
              </div>
            </TabsContent>
          </Tabs>
        </Card>
        
        <Card className="glass-morphism overflow-hidden">
          <Tabs defaultValue="output" className="w-full">
            <div className="flex items-center justify-between p-2 border-b border-border">
              <TabsList className="bg-secondary/30">
                <TabsTrigger value="output" className="data-[state=active]:bg-secondary">
                  <Terminal className="h-4 w-4 mr-2" />
                  Output
                </TabsTrigger>
              </TabsList>
              {output && (
                <div className="flex items-center mr-2">
                  {isError ? (
                    <XCircle className="h-4 w-4 text-destructive mr-1" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                  )}
                  <span className={`text-xs ${isError ? 'text-destructive' : 'text-green-500'}`}>
                    {isError ? 'Execution failed' : 'Execution successful'}
                  </span>
                </div>
              )}
            </div>
            <TabsContent value="output" className="p-0 m-0">
              <div className="w-full h-[calc(100vh-22rem)] bg-black/30 p-4 font-mono text-sm overflow-auto">
                {isRunning ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: "0ms" }}></div>
                        <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: "300ms" }}></div>
                        <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse" style={{ animationDelay: "600ms" }}></div>
                      </div>
                      <span className="text-muted-foreground mt-2">Executing with E2B...</span>
                    </div>
                  </div>
                ) : output ? (
                  <pre className={cn(isError && "text-destructive")}>{output}</pre>
                ) : (
                  <div className="text-muted-foreground italic">
                    Run your code to see output here...
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </motion.div>
  );
};

export default CodePlayground;
