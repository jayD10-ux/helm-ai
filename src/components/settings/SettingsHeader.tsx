
import { Button } from "@/components/ui/button";
import { Save, Server } from "lucide-react";
import { Link } from "react-router-dom";

interface SettingsHeaderProps {
  loading: boolean;
  onSave: () => void;
}

const SettingsHeader = ({ loading, onSave }: SettingsHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gradient">Settings</h1>
        <p className="text-muted-foreground">Configure your Helm AI experience and integrations</p>
        <div className="mt-2">
          <Link to="/mcps" className="text-sm text-primary flex items-center hover:underline">
            <Server className="h-3 w-3 mr-1" />
            Looking for MCP servers? Go to the MCP page
          </Link>
        </div>
      </div>
      <Button onClick={onSave} disabled={loading}>
        <Save className="h-4 w-4 mr-2" />
        {loading ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
};

export default SettingsHeader;
