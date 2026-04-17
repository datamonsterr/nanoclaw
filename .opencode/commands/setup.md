---
description: Run NanoClaw initial setup — install dependencies and configure services
agent: build
---

Run the NanoClaw setup skill. This handles:

1. Installing npm dependencies
2. Building the TypeScript project
3. Authenticating messaging channels (WhatsApp, Telegram, etc.)
4. Registering the main control channel
5. Starting background services

Run `npx tsx setup/index.ts` or use the `/setup` skill for interactive setup.
