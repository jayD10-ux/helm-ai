
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  );
};

export default ApiSettings;
