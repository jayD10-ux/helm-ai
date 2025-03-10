import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { fadeIn } from "@/components/ui/motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const SettingsInterface = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [modelType, setModelType] = useState("gpt-4");
  const [debugMode, setDebugMode] = useState(false);
  const [allowCodeExecution, setAllowCodeExecution] = useState(true);
  const [customInstructions, setCustomInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .limit(1)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setApiKey(data.api_key || "");
          setModelType(data.model_type || "gpt-4");
          setDebugMode(data.debug_mode || false);
          setAllowCodeExecution(data.allow_code_execution !== false);
          setCustomInstructions(data.custom_instructions || "");
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Error loading settings",
          description: "Failed to load your saved settings.",
          variant: "destructive"
        });
      }
    };
    
    loadSettings();
  }, []);
  
  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      const settings = {
        api_key: apiKey,
        model_type: modelType,
        debug_mode: debugMode,
        allow_code_execution: allowCodeExecution,
        custom_instructions: customInstructions,
      };
      
      const { error } = await supabase
        .from('user_settings')
        .upsert(settings, { onConflict: 'user_id' });
        
      if (error) throw error;
      
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error saving settings",
        description: "Failed to save your settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <motion.div
      {...fadeIn}
      className="h-full max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Settings</h1>
          <p className="text-muted-foreground">Configure your Helm AI experience</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-card w-full justify-start mb-6 p-1">
          <TabsTrigger value="general" className="flex-1 max-w-[200px] data-[state=active]:bg-secondary">
            General
          </TabsTrigger>
          <TabsTrigger value="api" className="flex-1 max-w-[200px] data-[state=active]:bg-secondary">
            API Configuration
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex-1 max-w-[200px] data-[state=active]:bg-secondary">
            Appearance
          </TabsTrigger>
          <TabsTrigger value="database" className="flex-1 max-w-[200px] data-[state=active]:bg-secondary">
            Database
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-0">
          <Card className="glass-morphism mb-6">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="debugMode">Debug Mode</Label>
                  <Switch
                    id="debugMode"
                    checked={debugMode}
                    onCheckedChange={setDebugMode}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enable detailed logging for troubleshooting
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="codeExecution">Allow Code Execution</Label>
                  <Switch
                    id="codeExecution"
                    checked={allowCodeExecution}
                    onCheckedChange={setAllowCodeExecution}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Allow AI to execute code in the sandbox environment
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customInstructions">Custom Instructions</Label>
                <Textarea
                  id="customInstructions"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Add custom instructions for the AI..."
                  className="min-h-[100px] bg-card border-border"
                />
                <p className="text-sm text-muted-foreground">
                  These instructions will be sent with every AI request
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api" className="mt-0">
          <Card className="glass-morphism mb-6">
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key..."
                  className="bg-card border-border"
                />
                <p className="text-sm text-muted-foreground">
                  Your API key for connecting to the LLM provider
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="modelType">Model Type</Label>
                <select
                  id="modelType"
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  className="w-full bg-card border border-border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="gpt-4">OpenAI GPT-4</option>
                  <option value="gpt-3.5-turbo">OpenAI GPT-3.5 Turbo</option>
                  <option value="claude-2">Anthropic Claude 2</option>
                  <option value="llama-3">Meta LLaMA 3</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  Select the AI model to use for Helm AI
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="mt-0">
          <Card className="glass-morphism mb-6">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="radio"
                      id="darkTheme"
                      name="theme"
                      className="peer sr-only"
                      defaultChecked
                    />
                    <label
                      htmlFor="darkTheme"
                      className="flex flex-col items-center justify-center p-4 rounded-lg border border-border bg-card peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary cursor-pointer transition-all"
                    >
                      <div className="w-full h-20 rounded-md bg-[#121212] mb-3"></div>
                      <span>Dark Theme</span>
                    </label>
                  </div>
                  
                  <div className="relative opacity-50">
                    <input
                      type="radio"
                      id="lightTheme"
                      name="theme"
                      className="peer sr-only"
                      disabled
                    />
                    <label
                      htmlFor="lightTheme"
                      className="flex flex-col items-center justify-center p-4 rounded-lg border border-border bg-card cursor-not-allowed transition-all"
                    >
                      <div className="w-full h-20 rounded-md bg-[#f8f9fa] mb-3"></div>
                      <span>Light Theme (Coming Soon)</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Font Size</Label>
                <div className="grid grid-cols-3 gap-4">
                  {["Small", "Medium", "Large"].map((size) => (
                    <div key={size} className="relative">
                      <input
                        type="radio"
                        id={`fontSize-${size}`}
                        name="fontSize"
                        className="peer sr-only"
                        defaultChecked={size === "Medium"}
                      />
                      <label
                        htmlFor={`fontSize-${size}`}
                        className="flex items-center justify-center p-2 rounded-lg border border-border bg-card peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary cursor-pointer transition-all"
                      >
                        {size}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="database" className="mt-0">
          <Card className="glass-morphism mb-6">
            <CardHeader>
              <CardTitle>Supabase Database</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-secondary/20 p-4 rounded-md">
                <p className="text-sm">
                  <span className="font-bold">Connection Status:</span> Connected to Supabase
                </p>
                <p className="text-sm mt-2">
                  <span className="font-bold">Project URL:</span> https://nwaeufzdrvwfavohsklz.supabase.co
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Database Tables</Label>
                  <Button variant="outline" size="sm" onClick={() => window.open('https://nwaeufzdrvwfavohsklz.supabase.co', '_blank')}>
                    Open Supabase Dashboard
                  </Button>
                </div>
                <div className="bg-card border border-border rounded-md p-3">
                  <ul className="space-y-2">
                    <li className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      chats
                    </li>
                    <li className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      messages
                    </li>
                    <li className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      user_settings
                    </li>
                    <li className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      mcps
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default SettingsInterface;
