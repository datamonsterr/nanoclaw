/**
 * OpenCode MCP bridge for NanoClaw.
 * Calls a host `opencode serve` instance over HTTP.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const OPENCODE_BASE_URL = (
  process.env.OPENCODE_BASE_URL || 'http://host.docker.internal:4096'
).replace(/\/$/, '');
const OPENCODE_SERVER_USERNAME =
  process.env.OPENCODE_SERVER_USERNAME || 'opencode';
const OPENCODE_SERVER_PASSWORD = process.env.OPENCODE_SERVER_PASSWORD || '';

interface SessionInfo {
  id: string;
  title: string;
}

function authHeader(): string | null {
  if (!OPENCODE_SERVER_PASSWORD) return null;
  const token = Buffer.from(
    `${OPENCODE_SERVER_USERNAME}:${OPENCODE_SERVER_PASSWORD}`,
  ).toString('base64');
  return `Basic ${token}`;
}

function buildUrl(
  pathname: string,
  query?: Record<string, string | undefined>,
): URL {
  const url = new URL(pathname, `${OPENCODE_BASE_URL}/`);
  for (const [key, value] of Object.entries(query || {})) {
    if (value) url.searchParams.set(key, value);
  }
  return url;
}

async function opencodeFetch<T>(
  pathname: string,
  options?: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: unknown;
    query?: Record<string, string | undefined>;
  },
): Promise<T> {
  const url = buildUrl(pathname, options?.query);
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  const auth = authHeader();
  if (auth) headers.Authorization = auth;
  if (options?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method: options?.method || 'GET',
    headers,
    body:
      options?.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `OpenCode ${options?.method || 'GET'} ${pathname} -> ${res.status}: ${text}`,
    );
  }

  if (res.status === 204) {
    return null as T;
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }

  return (await res.text()) as T;
}

function formatResult(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

async function ensureSession(
  sessionId: string | undefined,
  title: string | undefined,
  directory: string | undefined,
): Promise<string> {
  if (sessionId) return sessionId;
  const created = await opencodeFetch<SessionInfo>('/session', {
    method: 'POST',
    body: title ? { title } : {},
    query: { directory },
  });
  return created.id;
}

const server = new McpServer({ name: 'opencode', version: '1.0.0' });

server.tool(
  'opencode_status',
  'Check connectivity to the host OpenCode server and return health, current path, current project, and MCP status. The optional directory must be a host path visible to the OpenCode server.',
  {
    directory: z
      .string()
      .optional()
      .describe(
        'Optional host-side directory override for the OpenCode server',
      ),
  },
  async ({ directory }) => {
    const [health, pathInfo, project, mcp] = await Promise.all([
      opencodeFetch('/global/health'),
      opencodeFetch('/path', { query: { directory } }),
      opencodeFetch('/project/current', { query: { directory } }),
      opencodeFetch('/mcp', { query: { directory } }),
    ]);

    return {
      content: [
        {
          type: 'text' as const,
          text: formatResult({
            baseUrl: OPENCODE_BASE_URL,
            authenticated: !!OPENCODE_SERVER_PASSWORD,
            health,
            path: pathInfo,
            project,
            mcp,
          }),
        },
      ],
    };
  },
);

server.tool(
  'opencode_list_agents',
  'List agents available from the host OpenCode server.',
  {
    directory: z
      .string()
      .optional()
      .describe(
        'Optional host-side directory override for the OpenCode server',
      ),
  },
  async ({ directory }) => {
    const agents = await opencodeFetch('/agent', { query: { directory } });
    return {
      content: [{ type: 'text' as const, text: formatResult(agents) }],
    };
  },
);

server.tool(
  'opencode_list_commands',
  'List slash commands available from the host OpenCode server.',
  {
    directory: z
      .string()
      .optional()
      .describe(
        'Optional host-side directory override for the OpenCode server',
      ),
  },
  async ({ directory }) => {
    const commands = await opencodeFetch('/command', { query: { directory } });
    return {
      content: [{ type: 'text' as const, text: formatResult(commands) }],
    };
  },
);

server.tool(
  'opencode_list_sessions',
  'List sessions on the host OpenCode server.',
  {
    directory: z
      .string()
      .optional()
      .describe(
        'Optional host-side directory override for the OpenCode server',
      ),
  },
  async ({ directory }) => {
    const sessions = await opencodeFetch('/session', { query: { directory } });
    return {
      content: [{ type: 'text' as const, text: formatResult(sessions) }],
    };
  },
);

server.tool(
  'opencode_get_session',
  'Get details for a specific OpenCode session.',
  {
    session_id: z.string().describe('Existing OpenCode session ID'),
    directory: z
      .string()
      .optional()
      .describe(
        'Optional host-side directory override for the OpenCode server',
      ),
  },
  async ({ session_id, directory }) => {
    const session = await opencodeFetch(`/session/${session_id}`, {
      query: { directory },
    });
    return {
      content: [{ type: 'text' as const, text: formatResult(session) }],
    };
  },
);

server.tool(
  'opencode_list_messages',
  'List messages for an OpenCode session, including message parts. Use this to inspect existing session history instead of asking the user to open local session files.',
  {
    session_id: z.string().describe('Existing OpenCode session ID'),
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Optional maximum number of messages to return'),
    directory: z
      .string()
      .optional()
      .describe(
        'Optional host-side directory override for the OpenCode server',
      ),
  },
  async ({ session_id, limit, directory }) => {
    const messages = await opencodeFetch(`/session/${session_id}/message`, {
      query: {
        directory,
        limit: limit === undefined ? undefined : String(limit),
      },
    });
    return {
      content: [{ type: 'text' as const, text: formatResult(messages) }],
    };
  },
);

server.tool(
  'opencode_get_message',
  'Get one message with its parts from an OpenCode session.',
  {
    session_id: z.string().describe('Existing OpenCode session ID'),
    message_id: z.string().describe('Existing OpenCode message ID'),
    directory: z
      .string()
      .optional()
      .describe(
        'Optional host-side directory override for the OpenCode server',
      ),
  },
  async ({ session_id, message_id, directory }) => {
    const message = await opencodeFetch(
      `/session/${session_id}/message/${message_id}`,
      {
        query: { directory },
      },
    );
    return {
      content: [{ type: 'text' as const, text: formatResult(message) }],
    };
  },
);

server.tool(
  'opencode_create_session',
  'Create a new session on the host OpenCode server.',
  {
    title: z.string().optional().describe('Optional title for the new session'),
    directory: z
      .string()
      .optional()
      .describe(
        'Optional host-side directory override for the OpenCode server',
      ),
  },
  async ({ title, directory }) => {
    const session = await opencodeFetch('/session', {
      method: 'POST',
      body: title ? { title } : {},
      query: { directory },
    });
    return {
      content: [{ type: 'text' as const, text: formatResult(session) }],
    };
  },
);

server.tool(
  'opencode_prompt',
  'Send a text prompt to an OpenCode session and wait for the response. If session_id is omitted, a new session is created first.',
  {
    prompt: z.string().describe('Prompt text to send to OpenCode'),
    session_id: z.string().optional().describe('Existing OpenCode session ID'),
    title: z
      .string()
      .optional()
      .describe('Optional title when creating a new session'),
    agent: z.string().optional().describe('Optional OpenCode agent name'),
    model: z.string().optional().describe('Optional OpenCode model ID'),
    system: z.string().optional().describe('Optional extra system prompt'),
    no_reply: z
      .boolean()
      .default(false)
      .describe('If true, queue the message without waiting for a reply'),
    directory: z
      .string()
      .optional()
      .describe(
        'Optional host-side directory override for the OpenCode server',
      ),
  },
  async ({
    prompt,
    session_id,
    title,
    agent,
    model,
    system,
    no_reply,
    directory,
  }) => {
    const resolvedSessionId = await ensureSession(session_id, title, directory);
    const pathname = no_reply
      ? `/session/${resolvedSessionId}/prompt_async`
      : `/session/${resolvedSessionId}/message`;

    const result = await opencodeFetch(pathname, {
      method: 'POST',
      query: { directory },
      body: {
        agent,
        model,
        noReply: no_reply,
        system,
        parts: [{ type: 'text', text: prompt }],
      },
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: formatResult({
            sessionId: resolvedSessionId,
            result,
          }),
        },
      ],
    };
  },
);

server.tool(
  'opencode_command',
  'Run a slash command in an OpenCode session. If session_id is omitted, a new session is created first.',
  {
    command: z.string().describe('Command name without the leading slash'),
    arguments: z
      .string()
      .default('')
      .describe('Command arguments as a single string'),
    session_id: z.string().optional().describe('Existing OpenCode session ID'),
    title: z
      .string()
      .optional()
      .describe('Optional title when creating a new session'),
    agent: z.string().optional().describe('Optional OpenCode agent name'),
    model: z.string().optional().describe('Optional OpenCode model ID'),
    directory: z
      .string()
      .optional()
      .describe(
        'Optional host-side directory override for the OpenCode server',
      ),
  },
  async ({
    command,
    arguments: commandArguments,
    session_id,
    title,
    agent,
    model,
    directory,
  }) => {
    const resolvedSessionId = await ensureSession(session_id, title, directory);
    const result = await opencodeFetch(
      `/session/${resolvedSessionId}/command`,
      {
        method: 'POST',
        query: { directory },
        body: {
          command,
          arguments: commandArguments,
          agent,
          model,
        },
      },
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: formatResult({
            sessionId: resolvedSessionId,
            result,
          }),
        },
      ],
    };
  },
);

server.tool(
  'opencode_shell',
  'Run a shell command through an OpenCode session. If session_id is omitted, a new session is created first.',
  {
    command: z.string().describe('Shell command to run in OpenCode'),
    agent: z.string().describe('OpenCode agent name to use for the shell run'),
    model: z.string().optional().describe('Optional OpenCode model ID'),
    session_id: z.string().optional().describe('Existing OpenCode session ID'),
    title: z
      .string()
      .optional()
      .describe('Optional title when creating a new session'),
    directory: z
      .string()
      .optional()
      .describe(
        'Optional host-side directory override for the OpenCode server',
      ),
  },
  async ({ command, agent, model, session_id, title, directory }) => {
    const resolvedSessionId = await ensureSession(session_id, title, directory);
    const result = await opencodeFetch(`/session/${resolvedSessionId}/shell`, {
      method: 'POST',
      query: { directory },
      body: {
        command,
        agent,
        model,
      },
    });

    return {
      content: [
        {
          type: 'text' as const,
          text: formatResult({
            sessionId: resolvedSessionId,
            result,
          }),
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
