#!/bin/bash

# Update the chat input container in ChatInterface.tsx to fix the overlap with sidebar
# The sidebar has a width of 80px when collapsed and 250px when expanded
# We'll set it to match the sidebar width exactly

sed -i '' 's/className="fixed bottom-0 left-0 right-0 bg-background border-t border-neutral-800 pt-2 pb-4 z-10" style={{ paddingLeft: "calc(240px + 1rem)", paddingRight: "1rem" }}/className="fixed bottom-0 left-\[80px\] right-0 bg-background border-t border-neutral-800 pt-2 pb-4 px-4 z-10"/' src/components/chat/ChatInterface.tsx

echo "Fixed chat input overlap with sidebar!"
