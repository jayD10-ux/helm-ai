
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Processing authentication callback...");
  
  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const serverId = searchParams.get('server_id');
        
        if (!code || !state) {
          setStatus("error");
          setMessage("Invalid callback parameters. Missing code or state.");
          return;
        }
        
        // Import dynamically to avoid circular dependencies
        const { handleOAuthCallback } = await import('@/services/composio');
        const success = await handleOAuthCallback(code, state, serverId || undefined);
        
        if (success) {
          setStatus("success");
          setMessage("Authentication successful! You can close this window.");
          
          // Notify the opener window about successful authentication
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({
              type: "oauth-success",
              serverId,
              code,
              state
            }, window.location.origin);
          }
          
          // Close this window after a short delay
          setTimeout(() => {
            window.close();
          }, 3000);
        } else {
          setStatus("error");
          setMessage("Authentication failed. Please try again.");
        }
      } catch (error) {
        console.error('Error in OAuth callback:', error);
        setStatus("error");
        setMessage(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    processOAuthCallback();
  }, [searchParams]);
  
  const handleClose = () => {
    window.close();
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl text-center">
            MCP Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          {status === "processing" && (
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          )}
          {status === "success" && (
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          )}
          {status === "error" && (
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
          )}
          
          <p className="text-center text-muted-foreground">{message}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleClose}>
            Close Window
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OAuthCallback;
