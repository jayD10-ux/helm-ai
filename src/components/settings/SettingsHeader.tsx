
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface SettingsHeaderProps {
  loading: boolean;
  onSave: () => void;
}

const SettingsHeader = ({ loading, onSave }: SettingsHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gradient">Settings</h1>
        <p className="text-muted-foreground">Configure your Helm AI experience</p>
      </div>
      <Button onClick={onSave} disabled={loading}>
        <Save className="h-4 w-4 mr-2" />
        {loading ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
};

export default SettingsHeader;
