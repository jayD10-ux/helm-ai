
import { useState } from "react";
import { motion } from "framer-motion";
import { Terminal, Play, Save, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fadeIn } from "@/components/ui/motion";

const CodePlayground = () => {
  const [code, setCode] = useState("// Type your code here\nconsole.log('Hello, Helm AI!');");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  
  const handleRunCode = () => {
    setIsRunning(true);
    setOutput(""); // Clear previous output
    
    // Simulate code execution
    setTimeout(() => {
      setOutput("Hello, Helm AI!\n\nExecution completed successfully.");
      setIsRunning(false);
    }, 1000);
  };
  
  const handleSaveCode = () => {
    // Placeholder for save functionality
    console.log("Code saved:", code);
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
          <p className="text-muted-foreground">Write, test, and debug your code</p>
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
            </div>
            <TabsContent value="output" className="p-0 m-0">
              <div className="w-full h-[calc(100vh-22rem)] bg-black/30 p-4 font-mono text-sm overflow-auto">
                {output ? (
                  <pre>{output}</pre>
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
