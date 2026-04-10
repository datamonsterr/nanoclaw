/**
 * Jira MCP Server for NanoClaw
 * Reads JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN from environment.
 * Implements Jira REST API v3 operations as MCP tools.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL?.replace(/\/$/, '');
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

function authHeader(): string {
  return `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`;
}

async function jiraFetch(
  path: string,
  method = 'GET',
  body?: object,
): Promise<unknown> {
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    throw new Error(
      'JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN must be set',
    );
  }
  const url = `${JIRA_BASE_URL}/rest/api/3${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira API ${method} ${path} → ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const server = new McpServer({ name: 'jira', version: '1.0.0' });

// Search issues with JQL
server.tool(
  'jira_search',
  'Search Jira issues using JQL. Returns a list of matching issues.',
  {
    jql: z.string().describe('JQL query string, e.g. "assignee = currentUser() AND status != Done"'),
    maxResults: z.number().int().min(1).max(50).default(20).describe('Maximum number of results to return'),
    fields: z.array(z.string()).default(['summary', 'status', 'assignee', 'priority', 'issuetype', 'created', 'updated']).describe('Fields to include in each issue'),
  },
  async ({ jql, maxResults, fields }) => {
    const data = await jiraFetch(
      `/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=${fields.join(',')}`,
    ) as { issues: unknown[]; total: number };
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    };
  },
);

// Get a single issue
server.tool(
  'jira_get_issue',
  'Get full details of a Jira issue by key (e.g. PROJ-123).',
  {
    issueKey: z.string().describe('Issue key, e.g. PROJ-123'),
  },
  async ({ issueKey }) => {
    const data = await jiraFetch(`/issue/${issueKey}`);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    };
  },
);

// Create an issue
server.tool(
  'jira_create_issue',
  'Create a new Jira issue.',
  {
    projectKey: z.string().describe('Project key, e.g. PROJ'),
    summary: z.string().describe('Issue summary/title'),
    issueType: z.string().default('Task').describe('Issue type name, e.g. Task, Bug, Story'),
    description: z.string().optional().describe('Issue description in plain text'),
    priority: z.string().optional().describe('Priority name, e.g. High, Medium, Low'),
    assigneeAccountId: z.string().optional().describe('Account ID of the assignee'),
    labels: z.array(z.string()).optional().describe('Labels to apply to the issue'),
  },
  async ({ projectKey, summary, issueType, description, priority, assigneeAccountId, labels }) => {
    const fields: Record<string, unknown> = {
      project: { key: projectKey },
      summary,
      issuetype: { name: issueType },
    };
    if (description) {
      fields.description = {
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: description }] }],
      };
    }
    if (priority) fields.priority = { name: priority };
    if (assigneeAccountId) fields.assignee = { accountId: assigneeAccountId };
    if (labels?.length) fields.labels = labels;

    const data = await jiraFetch('/issue', 'POST', { fields });
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    };
  },
);

// Update an issue
server.tool(
  'jira_update_issue',
  'Update fields on an existing Jira issue.',
  {
    issueKey: z.string().describe('Issue key, e.g. PROJ-123'),
    summary: z.string().optional().describe('New summary'),
    description: z.string().optional().describe('New description in plain text'),
    priority: z.string().optional().describe('Priority name, e.g. High, Medium, Low'),
    assigneeAccountId: z.string().optional().describe('Account ID of the new assignee, or null to unassign'),
    labels: z.array(z.string()).optional().describe('Replacement label list'),
  },
  async ({ issueKey, summary, description, priority, assigneeAccountId, labels }) => {
    const fields: Record<string, unknown> = {};
    if (summary) fields.summary = summary;
    if (description) {
      fields.description = {
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: description }] }],
      };
    }
    if (priority) fields.priority = { name: priority };
    if (assigneeAccountId !== undefined)
      fields.assignee = assigneeAccountId ? { accountId: assigneeAccountId } : null;
    if (labels) fields.labels = labels;

    await jiraFetch(`/issue/${issueKey}`, 'PUT', { fields });
    return { content: [{ type: 'text' as const, text: `Updated ${issueKey}` }] };
  },
);

// Transition issue (change status)
server.tool(
  'jira_transition_issue',
  'Move a Jira issue to a new status via a workflow transition.',
  {
    issueKey: z.string().describe('Issue key, e.g. PROJ-123'),
    transitionId: z.string().describe('Transition ID (use jira_get_transitions to list available IDs)'),
    comment: z.string().optional().describe('Optional comment to add when transitioning'),
  },
  async ({ issueKey, transitionId, comment }) => {
    const body: Record<string, unknown> = { transition: { id: transitionId } };
    if (comment) {
      body.update = {
        comment: [{ add: { body: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: comment }] }] } } }],
      };
    }
    await jiraFetch(`/issue/${issueKey}/transitions`, 'POST', body);
    return { content: [{ type: 'text' as const, text: `Transitioned ${issueKey}` }] };
  },
);

// Get available transitions
server.tool(
  'jira_get_transitions',
  'Get available status transitions for a Jira issue.',
  {
    issueKey: z.string().describe('Issue key, e.g. PROJ-123'),
  },
  async ({ issueKey }) => {
    const data = await jiraFetch(`/issue/${issueKey}/transitions`);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    };
  },
);

// Add a comment
server.tool(
  'jira_add_comment',
  'Add a comment to a Jira issue.',
  {
    issueKey: z.string().describe('Issue key, e.g. PROJ-123'),
    comment: z.string().describe('Comment text'),
  },
  async ({ issueKey, comment }) => {
    const body = {
      body: {
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text: comment }] }],
      },
    };
    const data = await jiraFetch(`/issue/${issueKey}/comment`, 'POST', body);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    };
  },
);

// Get my issues
server.tool(
  'jira_my_issues',
  'Get Jira issues assigned to the current user that are not done.',
  {
    maxResults: z.number().int().min(1).max(50).default(20).describe('Maximum number of results'),
  },
  async ({ maxResults }) => {
    const jql = 'assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC';
    const data = await jiraFetch(
      `/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=summary,status,priority,issuetype,project,updated`,
    );
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    };
  },
);

// Get projects
server.tool(
  'jira_get_projects',
  'List accessible Jira projects.',
  {},
  async () => {
    const data = await jiraFetch('/project?expand=description');
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
