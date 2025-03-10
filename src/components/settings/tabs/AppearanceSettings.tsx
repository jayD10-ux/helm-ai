
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AppearanceSettings = () => {
  return (
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
  );
};

export default AppearanceSettings;
