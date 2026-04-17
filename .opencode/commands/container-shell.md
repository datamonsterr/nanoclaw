---
description: Open an interactive shell in a running NanoClaw agent container
agent: build
---

Open an interactive shell in a running NanoClaw agent container for debugging.

1. First, find the running container: `docker ps --filter name=nanoclaw`
2. Then shell into it: `docker exec -it <container-id> /bin/bash`
3. The container runs as node user with `/workspace/group` as the working directory.

Useful inspection commands inside the container:

- `ls /workspace/` — see workspace mounts
- `ls /home/node/.claude/skills/` — see installed skills
- `which agent-browser` — check if browser tool is available
- `node --version` — check Node.js version
