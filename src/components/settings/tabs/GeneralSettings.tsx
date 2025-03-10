
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GeneralSettingsProps {
  debugMode: boolean;
  setDebugMode: (value: boolean) => void;
  allowCodeExecution: boolean;
  setAllowCodeExecution: (value: boolean) => void;
  customInstructions: string;
  setCustomInstructions: (value: string) => void;
}

const GeneralSettings = ({
  debugMode,
  setDebugMode,
  allowCodeExecution,
  setAllowCodeExecution,
  customInstructions,
  setCustomInstructions
}: GeneralSettingsProps) => {
  return (
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
  );
};

export default GeneralSettings;
