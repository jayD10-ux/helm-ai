#!/bin/bash

# Update the chat input container in ChatInterface.tsx to be full width
sed -i '' 's/className="fixed bottom-0 left-\[240px\] right-0 bg-background border-t border-neutral-800 pt-2 pb-4 px-4 z-10"/className="fixed bottom-0 left-0 right-0 bg-background border-t border-neutral-800 pt-2 pb-4 px-4 z-10"/' src/components/chat/ChatInterface.tsx

echo "Fixed chat input width to be full width!"
