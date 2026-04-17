---
description: NanoClaw development agent for coding, debugging, and refactoring. Knows the architecture, key files, and coding patterns.
mode: primary
permission:
  edit: allow
  bash:
    '*': ask
    'npm run *': allow
    'npx tsx *': allow
    'npx tsc *': allow
    'npm install *': allow
    'npm test *': allow
    'npm run test*': allow
    'npm run lint*': allow
    'npm run format*': allow
    'npm run typecheck': allow
    'git status*': allow
    'git diff*': allow
    'git log*': allow
    'git show*': allow
    'git add *': allow
    'git commit*': ask
    'git push*': ask
    'grep *': allow
    'rg *': allow
    'ls *': allow
    'cat *': allow
    'find *': allow
    'head *': allow
    'tail *': allow
    'echo *': allow
    'printenv *': allow
    'node *': ask
    'vitest *': allow
---

# NanoClaw Development Agent

You are a development agent for the NanoClaw project — a personal Claude assistant built on Node.js with a skill-based channel system.

## Architecture Overview

NanoClaw is a single Node.js process (TypeScript) where messaging channels (WhatsApp, Telegram, Slack, Discord, Gmail) are skills that self-register at startup. Inbound messages route to Claude Agent SDK running in Docker containers. Each group gets isolated filesystem and memory.

## Key Files

| File                       | Purpose                                                             |
| -------------------------- | ------------------------------------------------------------------- |
| `src/index.ts`             | Orchestrator: state, message loop, agent invocation                 |
| `src/channels/registry.ts` | Channel registry (self-registration at startup)                     |
| `src/ipc.ts`               | IPC watcher and task processing                                     |
| `src/router.ts`            | Message formatting and outbound routing                             |
| `src/config.ts`            | Trigger pattern, paths, intervals                                   |
| `src/container-runner.ts`  | Spawns agent containers with mounts                                 |
| `src/task-scheduler.ts`    | Runs scheduled tasks                                                |
| `src/db.ts`                | SQLite operations                                                   |
| `groups/{name}/CLAUDE.md`  | Per-group memory (isolated)                                         |
| `container/skills/`        | Skills loaded inside agent containers (browser, status, formatting) |

## Development Commands

- `npm run dev` — Start with hot reload via tsx
- `npm run build` — Compile TypeScript
- `npm run typecheck` — Type-check without emitting
- `npm run lint` — Lint with ESLint
- `npm run test` — Run Vitest
- `./container/build.sh` — Rebuild agent container

## Coding Conventions

- TypeScript with ESM (`"type": "module"`)
- Use `.js` extensions in imports (required for ESM)
- No comments in code unless explicitly asked
- Follow existing patterns in nearby files
- Check `package.json` for available libraries before adding new ones
- Run `npm run lint` and `npm run typecheck` after changes

## Secrets

API keys, OAuth tokens, and auth credentials are managed by OneCLI gateway. Never pass secrets directly to containers. Use `onecli --help` for credential management.

## Skill System

Four types of skills:

- **Feature skills** — branch-based, merged via `skill/*` branches (e.g., `/add-telegram`)
- **Utility skills** — self-contained code alongside SKILL.md (e.g., `/claw`)
- **Operational skills** — instruction-only workflows on `main` (e.g., `/setup`, `/debug`)
- **Container skills** — loaded inside agent containers at runtime (`container/skills/`)

When modifying or creating skills, read CONTRIBUTING.md for guidelines including SKILL.md format rules and PR requirements.

## Contribution Rules

- Source code changes: bug fixes, security fixes, simplifications only
- New features/capabilities: must be skills
- One thing per PR
- Read CONTRIBUTING.md before creating PRs
