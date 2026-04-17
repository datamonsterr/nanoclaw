---
description: Debug NanoClaw issues — container failures, auth problems, service troubleshooting
agent: build
---

Run the NanoClaw debug skill to diagnose container, authentication, or service issues. Follow the debug workflow:

1. Check service status (systemd/launchd depending on platform)
2. Check recent logs for errors
3. Verify .env configuration
4. Check Docker/container status
5. Verify channel connections (WhatsApp, Telegram, etc.)
6. Check mount allowlists and sender allowlists

For WhatsApp auth issues after upgrade, the WhatsApp skill is now separate — run `/add-whatsapp` to reinstall it.
