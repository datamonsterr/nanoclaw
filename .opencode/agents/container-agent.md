---
description: Agent for work inside NanoClaw containers — understands the container environment, MCP tools, scheduling, messaging, and workspace layout.
mode: subagent
hidden: true
permission:
  bash:
    '*': ask
    'agent-browser *': allow
    'ls *': allow
    'cat *': allow
    'node *': allow
    'which *': allow
    'test *': allow
    'echo *': allow
    'printenv *': allow
---

# NanoClaw Container Agent

You understand the NanoClaw container environment for work inside agent containers.

## Container Environment

Containers run Node.js with the Claude Agent SDK. Key details:

- Base image: `node:22-slim` with Chromium installed
- Workdir: `/workspace/group`
- Non-root user: `node`
- Entry: JSON from stdin, JSON to stdout
- Follow-up messages via `/workspace/ipc/input/`

## Workspace Layout

| Path                         | Purpose                                |
| ---------------------------- | -------------------------------------- |
| `/workspace/group/`          | Group workspace (writable)             |
| `/workspace/project/`        | Main channel project mount (main only) |
| `/workspace/extra/`          | Additional mounts from allowlist       |
| `/workspace/ipc/messages/`   | Outbound messages                      |
| `/workspace/ipc/tasks/`      | Scheduled tasks                        |
| `/workspace/ipc/input/`      | Incoming messages                      |
| `/workspace/global/`         | Shared global data                     |
| `/home/node/.claude/skills/` | Synced container skills                |

## Core Tools

Always available:

- **Bash, Read, Write, Edit, Glob, Grep** — standard file/code tools
- **WebSearch, WebFetch** — web access
- **Task, TaskOutput, TaskStop** — sub-task orchestration
- **TeamCreate, TeamDelete, SendMessage** — multi-agent teams
- **TodoWrite** — task tracking
- **ToolSearch** — discover available tools
- **Skill** — load container skill instructions
- **NotebookEdit** — notebook editing

## MCP Server Tools (nanoclaw)

The `mcp__nanoclaw__*` prefix tools:

- `send_message` — send a message to the user/group
- `schedule_task` — schedule a recurring or one-time task
- `list_tasks` — list scheduled tasks
- `pause_task` / `resume_task` — pause/resume tasks
- `cancel_task` — cancel and delete a task
- `update_task` — update an existing task
- `register_group` — register a new chat/group (main channel only)

## Container Skills

Installed in `/home/node/.claude/skills/`:

- `/agent-browser` — web browsing, form filling, data extraction, screenshots
- `/capabilities` — system capabilities report
- `/status` — quick health check
- `/slack-formatting` — Slack mrkdwn syntax

## Group Memory

Each group has a `CLAUDE.md` at `/workspace/group/CLAUDE.md` that persists across sessions. Use it for:

- Storing group-specific context and preferences
- Documenting decisions and recurring patterns
- Sharing state between sessions within the same group
