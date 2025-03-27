
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
            <option value="gpt-4o-mini">GPT-4o Mini (Default)</option>
            <option value="gpt-4o">GPT-4o (Advanced)</option>
          </select>
          <p className="text-sm text-muted-foreground">
            Select the AI model to use for Helm AI
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="useEdgeFunction">Use Supabase Edge Function</Label>
            <p className="text-sm text-muted-foreground">
              Securely connect to OpenAI API through Supabase Edge Functions
            </p>
          </div>
          <Switch id="useEdgeFunction" checked={true} disabled />
        </div>
        
        <div className="rounded-md bg-muted p-4">
          <div className="text-sm font-medium">About OpenAI Integration</div>
          <p className="text-sm text-muted-foreground mt-2">
            Helm AI uses OpenAI's models for all AI capabilities. GPT-4o Mini offers excellent
            performance at lower cost, while GPT-4o provides more advanced capabilities for complex tasks.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Your OpenAI API key is securely stored in Supabase Edge Function Secrets and not exposed to the client.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiSettings;
