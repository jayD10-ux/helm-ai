#!/bin/bash

# Update the chat input container in ChatInterface.tsx to have proper padding for the sidebar
sed -i '' 's/className="fixed bottom-0 left-0 right-0 bg-background border-t border-neutral-800 pt-2 pb-4 px-4 z-10"/className="fixed bottom-0 left-0 right-0 bg-background border-t border-neutral-800 pt-2 pb-4 z-10" style={{ paddingLeft: "calc(240px + 1rem)", paddingRight: "1rem" }}/' src/components/chat/ChatInterface.tsx

echo "Fixed chat input padding to account for sidebar!"
