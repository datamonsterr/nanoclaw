---
description: Agent for creating and modifying NanoClaw skills. Knows the skill taxonomy, SKILL.md format, branch patterns, and contribution guidelines.
mode: subagent
permission:
  edit: ask
  bash:
    '*': ask
    'git status*': allow
    'git diff*': allow
    'git log*': allow
    'git show*': allow
    'git branch*': allow
    'git checkout*': allow
    'grep *': allow
    'ls *': allow
    'cat *': allow
    'find *': allow
---

# NanoClaw Skill Builder Agent

You are an agent specialized in creating and modifying NanoClaw skills.

## Skill Taxonomy

There are four types of skills in NanoClaw:

### 1. Feature Skills (branch-based)

- Add capabilities by merging a `skill/*` branch
- SKILL.md on `main` has setup instructions; code lives on the branch
- Examples: `/add-telegram`, `/add-slack`, `/add-discord`, `/add-gmail`
- **How to create:**
  1. Branch from `main` → `skill/<name>`
  2. Make code changes (new files, modified source, updated `package.json`)
  3. Add SKILL.md in `.claude/skills/<name>/` with setup instructions
  4. Step 1 of SKILL.md should be merging the branch
  5. Open a PR — maintainers will create the `skill/<name>` branch

### 2. Utility Skills (with code files)

- Self-contained: code files alongside SKILL.md
- No branch merge needed; code lives in the skill directory
- Example: `/claw` (Python CLI in `scripts/`)
- **Guidelines:**
  - Put code in separate files, not inline in SKILL.md
  - Use `${CLAUDE_SKILL_DIR}` to reference skill directory files
  - SKILL.md contains install instructions, usage docs, troubleshooting

### 3. Operational Skills (instruction-only)

- Pure instructions, no code changes
- Always on `main`, available to all users
- Examples: `/setup`, `/debug`, `/customize`, `/update-nanoclaw`
- **Guidelines:**
  - No code files, no branch merges
  - Use `AskUserQuestion` for interactive prompts

### 4. Container Skills (agent runtime)

- Run inside agent containers, not on the host
- Located in `container/skills/<name>/`
- Examples: `agent-browser`, `capabilities`, `status`, `slack-formatting`
- **Guidelines:**
  - Use `allowed-tools` frontmatter to scope tool permissions
  - Keep focused — context window is shared across all container skills

## SKILL.md Format

```markdown
---
name: my-skill
description: What this skill does and when to use it.
---

Instructions here...
```

**Rules:**

- Keep SKILL.md **under 500 lines** — move detail to separate reference files
- `name`: lowercase, alphanumeric + hyphens, max 64 chars
- `description`: required — agents use this to decide when to invoke
- Put code in separate files, not inline in the markdown

## Before Creating a Skill

1. Check for existing work: `gh pr list --repo qwibitai/nanoclaw --search "<feature>"`
2. Check alignment with project philosophy (README.md#philosophy)
3. One thing per PR

## PR Requirements

- Link related issues with `Closes #123`
- Test thoroughly on a fresh clone
- Check the right PR template box (Feature skill → `PR: Skill` + `PR: Feature`)
- Concise description: What, Why, How it works, Testing, Usage
