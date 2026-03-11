# featureos-mcp

MCP server for the [FeatureOS API](https://developers.featureos.app). Runs locally via stdio for use with Claude Desktop.

## Tools

### Posts
| Tool | Description |
|---|---|
| `list_posts` | List posts with filters (approval status, board, date range, sort) |
| `get_post` | Get a single post by ID |
| `create_post` | Create a new post |
| `update_post` | Update title, description, board, status, approval, etc. |
| `delete_post` | Permanently delete a post |

### Moderation
| Tool | Description |
|---|---|
| `list_pending_posts` | List all posts pending moderation |
| `approve_post` | Approve a pending post |
| `reject_post` | Reject a post (keeps as pending — use `delete_post` for hard removal) |

### Comments
| Tool | Description |
|---|---|
| `list_comments` | List comments, optionally filtered to a post |
| `get_comment` | Get a single comment by ID |
| `create_comment` | Add a comment to a post (supports internal flag) |
| `update_comment` | Update comment text or pinned status |
| `delete_comment` | Permanently delete a comment |

### Merge Posts
| Tool | Description |
|---|---|
| `list_merged_posts` | List all child posts merged into a parent post |
| `merge_posts` | Merge one or more posts into a parent (max 30). Consolidates votes, comments, and subscribers. |
| `unmerge_post` | Unmerge a child post, restoring it as independent |

## Setup

### 1. Install dependencies

```bash
cd featureos-mcp
npm install
```

### 2. Get your FeatureOS API key

Dashboard → Settings → API Keys. Keys start with `hn_`.

### 3. Get a JWT token (required for merge tools)

The merge posts tools (`merge_posts`, `unmerge_post`, `list_merged_posts`) require a JWT token for user-level authentication in addition to the API key. Only organization members (admins or team members) can merge and unmerge posts.

Generate a JWT token through your FeatureOS portal's [Single Sign-On settings](https://help.featureos.app/en/articles/setting-up-single-sign-on-for-your-featureos-portal).

### 4. Configure Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "featureos": {
      "command": "node",
      "args": ["/absolute/path/to/featureos-mcp/src/index.js"],
      "env": {
        "FEATUREOS_API_KEY": "hn_your_key_here",
        "FEATUREOS_JWT_TOKEN": "your_jwt_token_here"
      }
    }
  }
}
```

Replace `/absolute/path/to/featureos-mcp` with the actual path on your machine.

> **Note:** `FEATUREOS_JWT_TOKEN` is optional — it is only needed if you want to use the merge posts tools. All other tools work with just the API key.

### 5. Restart Claude Desktop

The featureos tools will appear in the tools menu.

## Example prompts

- "List all posts pending moderation"
- "Approve post 1234"
- "Show me the last 20 feedback posts sorted by newest"
- "List all comments on post 5678"
- "Add an internal comment to post 9012 saying we're investigating this"
- "Delete comment 3456"
- "List all posts merged into post 1234"
- "Merge posts 5678 and 9012 into post 1234"
- "Unmerge post 5678"

## Notes

- FeatureOS has no explicit `rejected` status on posts — `reject_post` keeps the post as `pending`. Use `delete_post` if you want it gone entirely.
- `create_comment` supports an `internal` flag for team-only notes not visible to the post submitter.
- The `ALLOW-PRIVATE` header is sent on all requests so private board posts are always accessible.
- Merge tools require a `FEATUREOS_JWT_TOKEN` environment variable. The JWT provides user-level authentication — only organization members (admins/team members) can merge and unmerge posts. Generate one via your portal's SSO settings.
