
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fadeIn } from "@/components/ui/motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// Import our components
import SettingsHeader from "./SettingsHeader";
import GeneralSettings from "./tabs/GeneralSettings";
import ApiSettings from "./tabs/ApiSettings";
import AppearanceSettings from "./tabs/AppearanceSettings";
import DatabaseSettings from "./tabs/DatabaseSettings";

const SettingsInterface = () => {
  const [apiKey, setApiKey] = useState("");
  const [modelType, setModelType] = useState("gpt-4o-mini");
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
          setModelType(data.model_type || "gpt-4o-mini");
          setDebugMode(data.debug_mode || false);
          setAllowCodeExecution(data.allow_code_execution !== false);
          setCustomInstructions(data.custom_instructions || "");
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error("Failed to load your saved settings.");
      }
    };
    
    loadSettings();
  }, []);
  
  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      // Get the current MCP servers to preserve them
      const { data: currentData } = await supabase
        .from('user_settings')
        .select('mcp_servers')
        .limit(1)
        .single();
      
      const settings = {
        api_key: apiKey,
        model_type: modelType,
        debug_mode: debugMode,
        allow_code_execution: allowCodeExecution,
        custom_instructions: customInstructions,
        // Preserve the existing MCP servers data
        mcp_servers: currentData?.mcp_servers || [],
      };
      
      const { error } = await supabase
        .from('user_settings')
        .upsert(settings, { onConflict: 'user_id' });
        
      if (error) throw error;
      
      toast.success("Your settings have been saved successfully.");
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Failed to save your settings.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <motion.div
      {...fadeIn}
      className="h-full max-w-4xl mx-auto"
    >
      <SettingsHeader loading={loading} onSave={handleSaveSettings} />
      
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
          <GeneralSettings 
            debugMode={debugMode}
            setDebugMode={setDebugMode}
            allowCodeExecution={allowCodeExecution}
            setAllowCodeExecution={setAllowCodeExecution}
            customInstructions={customInstructions}
            setCustomInstructions={setCustomInstructions}
          />
        </TabsContent>
        
        <TabsContent value="api" className="mt-0">
          <ApiSettings 
            apiKey={apiKey}
            setApiKey={setApiKey}
            modelType={modelType}
            setModelType={setModelType}
          />
        </TabsContent>
        
        <TabsContent value="appearance" className="mt-0">
          <AppearanceSettings />
        </TabsContent>
        
        <TabsContent value="database" className="mt-0">
          <DatabaseSettings />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default SettingsInterface;
