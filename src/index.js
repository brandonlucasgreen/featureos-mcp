#!/usr/bin/env node
// src/index.js
// FeatureOS MCP server — stdio transport for Claude Desktop

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createClient } from "./featureos.js";

const api = createClient(process.env.FEATUREOS_API_KEY);

const server = new McpServer({
  name: "featureos",
  version: "1.0.0",
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function ok(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function err(e) {
  return {
    content: [{ type: "text", text: `Error: ${e.message}` }],
    isError: true,
  };
}

// ── Posts ─────────────────────────────────────────────────────────────────────

server.tool(
  "list_posts",
  "List feedback posts. Filter by approval_status, board, date range, status, tags, etc.",
  {
    page: z.number().int().optional().describe("Page number (default 1)"),
    per_page: z.number().int().optional().describe("Results per page (default 30, max 100)"),
    approval_status: z.enum(["approved", "pending"]).optional().describe("Filter by approval status"),
    bucket_id: z.number().int().optional().describe("Filter to a specific board ID"),
    sort: z
      .enum(["top", "latest_created_at", "oldest_created_at", "latest_updated_at", "oldest_updated_at"])
      .optional()
      .describe("Sort order"),
    from_date: z.string().optional().describe("Start date filter (YYYY-MM-DD)"),
    to_date: z.string().optional().describe("End date filter (YYYY-MM-DD)"),
  },
  async (params) => {
    try {
      return ok(await api.listPosts(params));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "get_post",
  "Get a single feedback post by ID.",
  {
    id: z.number().int().describe("Post ID"),
  },
  async ({ id }) => {
    try {
      return ok(await api.getPost(id));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "create_post",
  "Create a new feedback post.",
  {
    title: z.string().describe("Post title (required)"),
    description: z.string().optional().describe("Post body (HTML allowed)"),
    bucket_id: z.number().int().describe("Board ID to post to (required)"),
    tag_ids: z.array(z.number().int()).optional().describe("Tag IDs to attach"),
    state_id: z.number().int().optional().describe("Custom status ID"),
  },
  async (params) => {
    try {
      return ok(await api.createPost(params));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "update_post",
  "Update a feedback post. Can change title, description, board, status, approval_status, scores, etc.",
  {
    id: z.number().int().describe("Post ID"),
    title: z.string().optional(),
    description: z.string().optional().describe("HTML allowed"),
    bucket_id: z.number().int().optional().describe("Move to a different board"),
    approval_status: z.enum(["approved", "pending"]).optional().describe("Approve or move back to pending"),
    state_id: z.number().int().optional().describe("Custom status ID"),
    status: z.enum(["closed"]).optional().describe("Close the post (deprecated in favour of state_id)"),
  },
  async ({ id, ...fields }) => {
    try {
      return ok(await api.updatePost(id, fields));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "delete_post",
  "Permanently delete a feedback post by ID.",
  {
    id: z.number().int().describe("Post ID"),
  },
  async ({ id }) => {
    try {
      return ok(await api.deletePost(id));
    } catch (e) {
      return err(e);
    }
  }
);

// ── Moderation ────────────────────────────────────────────────────────────────

server.tool(
  "list_pending_posts",
  "List all feedback posts currently pending moderation (approval_status=pending), oldest first.",
  {
    bucket_id: z.number().int().optional().describe("Filter to a specific board"),
    per_page: z.number().int().optional().describe("Results per page (default 100)"),
  },
  async (params) => {
    try {
      return ok(await api.listPendingPosts(params));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "approve_post",
  "Approve a pending feedback post (sets approval_status to 'approved').",
  {
    id: z.number().int().describe("Post ID"),
  },
  async ({ id }) => {
    try {
      return ok(await api.approvePost(id));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "reject_post",
  "Reject a pending feedback post. Note: FeatureOS has no explicit 'rejected' status — this keeps the post as pending/hidden. Use delete_post if you want permanent removal.",
  {
    id: z.number().int().describe("Post ID"),
  },
  async ({ id }) => {
    try {
      return ok(await api.rejectPost(id));
    } catch (e) {
      return err(e);
    }
  }
);

// ── Comments ──────────────────────────────────────────────────────────────────

server.tool(
  "list_comments",
  "List comments, optionally filtered to a specific post.",
  {
    feature_request_id: z.number().int().optional().describe("Filter to comments on a specific post ID"),
    page: z.number().int().optional().describe("Page number"),
    from_date: z.string().optional().describe("Start date filter (YYYY-MM-DD)"),
    to_date: z.string().optional().describe("End date filter (YYYY-MM-DD)"),
  },
  async (params) => {
    try {
      return ok(await api.listComments(params));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "get_comment",
  "Get a single comment by ID.",
  {
    id: z.number().int().describe("Comment ID"),
  },
  async ({ id }) => {
    try {
      return ok(await api.getComment(id));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "create_comment",
  "Add a comment to a feedback post.",
  {
    feature_request_id: z.number().int().describe("Post ID to comment on"),
    comment: z.string().describe("Comment text"),
    internal: z.boolean().optional().describe("If true, marks as internal comment (not visible to submitter)"),
  },
  async (params) => {
    try {
      return ok(await api.createComment(params));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "update_comment",
  "Update a comment's text or pinned status.",
  {
    id: z.number().int().describe("Comment ID"),
    comment: z.string().optional().describe("New comment text"),
    pinned: z.boolean().optional().describe("Pin or unpin the comment"),
  },
  async ({ id, ...fields }) => {
    try {
      return ok(await api.updateComment(id, fields));
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "delete_comment",
  "Permanently delete a comment by ID.",
  {
    id: z.number().int().describe("Comment ID"),
  },
  async ({ id }) => {
    try {
      return ok(await api.deleteComment(id));
    } catch (e) {
      return err(e);
    }
  }
);

// ── Start ─────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
