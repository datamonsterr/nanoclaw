---
description: Reference for MCP tools and external integrations available in the NanoClaw host environment
---

# NanoClaw Host Tools Reference

## MCP Servers

### context7 (configured in opencode.json)

- **Command:** `npx -y @upstash/context7-mcp@latest`
- **Purpose:** Library documentation lookup for up-to-date API references
- **Usage:** Automatically available when coding; provides current docs for libraries

### nanoclaw (host-side MCP)

The host NanoClaw process connects to Claude Agent SDK containers. From the host perspective:

- Container spawning via `src/container-runner.ts`
- Message routing via `src/router.ts`
- IPC processing via `src/ipc.ts`
- Task scheduling via `src/task-scheduler.ts`

### Additional MCP servers (added via skills)

Skills can add MCP server configurations:

- **Jira MCP** — via `/add-telegram` or `/add-slack` channel skills
- **Gmail MCP** — via `/add-gmail` skill
- **Ollama MCP** — via `/add-ollama-tool` skill
- **PDF Reader** — via `/add-pdf-reader` skill
- **Image Vision** — via `/add-image-vision` skill

### OpenCode bridge (env-gated)

NanoClaw can also expose a host `opencode serve` instance to container agents.

- Enable with `OPENCODE_MCP_ENABLED=true`
- Default target: `http://host.docker.internal:4096`
- Override target with `OPENCODE_BASE_URL`
- If the server uses basic auth, also set `OPENCODE_SERVER_USERNAME` and `OPENCODE_SERVER_PASSWORD`

When enabled, the container gets `mcp__opencode__*` tools for:

- server status
- listing agents, commands, and sessions
- listing session messages
- creating sessions
- sending prompts
- running slash commands
- running shell commands

## Key npm Scripts

| Script         | Command                          | Purpose                 |
| -------------- | -------------------------------- | ----------------------- |
| `dev`          | `tsx src/index.ts`               | Start with hot reload   |
| `build`        | `tsc`                            | Compile TypeScript      |
| `start`        | `node dist/index.js`             | Start production build  |
| `typecheck`    | `tsc --noEmit`                   | Type-check without emit |
| `lint`         | `eslint src/`                    | Lint source files       |
| `lint:fix`     | `eslint src/ --fix`              | Lint and auto-fix       |
| `format`       | `prettier --write "src/**/*.ts"` | Format source           |
| `format:check` | `prettier --check "src/**/*.ts"` | Check formatting        |
| `test`         | `vitest run`                     | Run tests               |
| `test:watch`   | `vitest`                         | Run tests in watch mode |
| `setup`        | `tsx setup/index.ts`             | Run interactive setup   |
| `auth`         | `tsx src/whatsapp-auth.ts`       | WhatsApp authentication |

## OneCLI Gateway

- Default URL: `http://localhost:10254`
- Manages API keys, OAuth tokens, and auth credentials
- Injects secrets into containers at request time
- Never passes credentials directly to containers
