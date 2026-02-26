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

## Setup

### 1. Install dependencies

```bash
cd featureos-mcp
npm install
```

### 2. Get your FeatureOS API key

Dashboard → Settings → API Keys. Keys start with `hn_`.

### 3. Configure Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "featureos": {
      "command": "node",
      "args": ["/absolute/path/to/featureos-mcp/src/index.js"],
      "env": {
        "FEATUREOS_API_KEY": "hn_your_key_here"
      }
    }
  }
}
```

Replace `/absolute/path/to/featureos-mcp` with the actual path on your machine.

### 4. Restart Claude Desktop

The featureos tools will appear in the tools menu.

## Example prompts

- "List all posts pending moderation"
- "Approve post 1234"
- "Show me the last 20 feedback posts sorted by newest"
- "List all comments on post 5678"
- "Add an internal comment to post 9012 saying we're investigating this"
- "Delete comment 3456"

## Notes

- FeatureOS has no explicit `rejected` status on posts — `reject_post` keeps the post as `pending`. Use `delete_post` if you want it gone entirely.
- `create_comment` supports an `internal` flag for team-only notes not visible to the post submitter.
- The `ALLOW-PRIVATE` header is sent on all requests so private board posts are always accessible.
