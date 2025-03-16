
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

interface ApiSettingsProps {
  apiKey: string;
  setApiKey: (value: string) => void;
  modelType: string;
  setModelType: (value: string) => void;
}

const ApiSettings = ({
  apiKey,
  setApiKey,
  modelType,
  setModelType
}: ApiSettingsProps) => {
  return (
    <Card className="glass-morphism mb-6">
      <CardHeader>
        <CardTitle>API Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="modelType">AI Model</Label>
          <select
            id="modelType"
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
            className="w-full bg-card border border-border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Default)</option>
            <option value="claude-3-opus">Claude 3 Opus</option>
            <option value="claude-3-haiku">Claude 3 Haiku</option>
          </select>
          <p className="text-sm text-muted-foreground">
            Select the AI model to use for Helm AI
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="usePuter">Use Puter.js for Claude API</Label>
            <p className="text-sm text-muted-foreground">
              Puter.js provides free access to Claude models without API keys
            </p>
          </div>
          <Switch id="usePuter" checked={true} disabled />
        </div>
        
        <div className="rounded-md bg-muted p-4">
          <div className="text-sm font-medium">About Puter.js</div>
          <p className="text-sm text-muted-foreground mt-2">
            Helm AI now uses Puter.js to access Claude 3.5 Sonnet without API keys or usage limits.
            This "User Pays" model allows you to use advanced AI capabilities without any subscription costs.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiSettings;
