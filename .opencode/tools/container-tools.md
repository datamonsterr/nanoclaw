---
description: Reference for tools available inside NanoClaw agent containers (Claude Agent SDK)
---

# NanoClaw Container Tools Reference

## Core SDK Tools

These tools are available to the Claude Agent SDK inside containers:

| Tool             | Purpose                         |
| ---------------- | ------------------------------- |
| **Bash**         | Execute shell commands          |
| **Read**         | Read file contents              |
| **Write**        | Create or overwrite files       |
| **Edit**         | Replace exact strings in files  |
| **Glob**         | Find files by pattern matching  |
| **Grep**         | Search file contents with regex |
| **WebSearch**    | Search the web for information  |
| **WebFetch**     | Fetch web page content          |
| **Task**         | Launch sub-tasks                |
| **TaskOutput**   | Get sub-task results            |
| **TaskStop**     | Stop running sub-tasks          |
| **TeamCreate**   | Create multi-agent teams        |
| **TeamDelete**   | Delete agent teams              |
| **SendMessage**  | Send messages between agents    |
| **TodoWrite**    | Manage task/todo lists          |
| **ToolSearch**   | Discover available tools        |
| **Skill**        | Load skill instructions         |
| **NotebookEdit** | Edit notebook cells             |

## MCP Tools (nanoclaw prefix)

All `mcp__nanoclaw__*` tools for interacting with the host:

| Tool             | Description                                   | Parameters                                                                                        |
| ---------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `send_message`   | Send a message to the user/group              | `text` (string)                                                                                   |
| `schedule_task`  | Schedule a recurring or one-time task         | `prompt`, `schedule_type` (cron/interval/once), `schedule_value`, `context_mode` (group/isolated) |
| `list_tasks`     | List all scheduled tasks                      | none                                                                                              |
| `pause_task`     | Pause a scheduled task                        | `task_id`                                                                                         |
| `resume_task`    | Resume a paused task                          | `task_id`                                                                                         |
| `cancel_task`    | Cancel and delete a task                      | `task_id`                                                                                         |
| `update_task`    | Update an existing task                       | `task_id`, fields to update                                                                       |
| `register_group` | Register a new chat/group (main channel only) | `jid`, `name`, etc.                                                                               |

## Container CLI Tools

| Tool              | Path                           | Purpose                           |
| ----------------- | ------------------------------ | --------------------------------- |
| **agent-browser** | `/usr/local/bin/agent-browser` | Chromium-based browser automation |
| **node**          | `/usr/local/bin/node`          | Node.js v22 runtime               |
| **claude**        | `/usr/local/bin/claude`        | Claude Code CLI                   |
| **git**           | `/usr/bin/git`                 | Version control                   |
| **curl**          | `/usr/bin/curl`                | HTTP client                       |
| **chromium**      | `/usr/bin/chromium`            | Headless browser                  |

## agent-browser Commands

```bash
agent-browser open <url>         # Navigate to page
agent-browser snapshot -i        # Get interactive elements
agent-browser click @ref         # Click element by ref
agent-browser fill @ref "text"   # Fill input field
agent-browser close               # Close browser
agent-browser screenshot          # Take screenshot
agent-browser get text @ref      # Get element text
agent-browser eval "JS"          # Execute JavaScript
```

See `container/skills/agent-browser/SKILL.md` for full command reference.

## Container Skills

Loaded from `/home/node/.claude/skills/`:

- `agent-browser` — web browsing and automation
- `capabilities` — system capabilities report (`/capabilities`)
- `status` — health check (`/status`)
- `slack-formatting` — Slack mrkdwn output formatting

## Workspace Paths

| Path                  | Purpose                              |
| --------------------- | ------------------------------------ |
| `/workspace/group/`   | Group workspace (writable, persists) |
| `/workspace/project/` | Project mount (main channel only)    |
| `/workspace/extra/`   | Additional mount points              |
| `/workspace/ipc/`     | Inter-process communication          |
| `/workspace/global/`  | Shared global data                   |
