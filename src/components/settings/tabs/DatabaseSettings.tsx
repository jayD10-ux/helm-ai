
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DatabaseSettings = () => {
  return (
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
  );
};

export default DatabaseSettings;
