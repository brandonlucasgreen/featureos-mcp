// src/featureos.js
// Thin wrapper around the FeatureOS REST API

const BASE = "https://api.featureos.app/api/v3";

export function createClient(apiKey, jwtToken) {
  if (!apiKey) throw new Error("FEATUREOS_API_KEY is required");

  function headers(extra = {}) {
    const h = {
      "API-KEY": apiKey,
      "Content-Type": "application/json",
      "ALLOW-PRIVATE": "true",
      ...extra,
    };
    if (jwtToken) {
      h["Authorization"] = `Bearer ${jwtToken}`;
    }
    return h;
  }

  async function request(method, path, { params, body } = {}) {
    let url = `${BASE}${path}`;
    if (params) {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
      ).toString();
      if (qs) url += `?${qs}`;
    }

    const res = await fetch(url, {
      method,
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`FeatureOS returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
    }

    if (!res.ok) {
      throw new Error(`FeatureOS API error ${res.status}: ${JSON.stringify(data)}`);
    }

    return data;
  }

  return {
    // ── Posts ──────────────────────────────────────────────────────────────

    listPosts(params = {}) {
      return request("GET", "/feature_requests", { params });
    },

    getPost(id) {
      return request("GET", `/feature_requests/${id}`);
    },

    createPost({ title, description, bucket_id, tag_ids, state_id }) {
      return request("POST", "/feature_requests", {
        body: { title, description, bucket_id, tag_ids, state_id },
      });
    },

    updatePost(id, fields) {
      return request("PUT", `/feature_requests/${id}`, { body: fields });
    },

    deletePost(id) {
      return request("DELETE", `/feature_requests/${id}`);
    },

    // ── Moderation ─────────────────────────────────────────────────────────

    listPendingPosts(extra = {}) {
      return request("GET", "/feature_requests", {
        params: { approval_status: "pending", per_page: 100, sort: "oldest_created_at", ...extra },
      });
    },

    approvePost(id) {
      return request("PUT", `/feature_requests/${id}`, {
        body: { approval_status: "approved" },
      });
    },

    rejectPost(id) {
      // FeatureOS has no explicit "rejected" status — this keeps the post pending
      // but is the correct API action for "do not approve". Delete if you want hard removal.
      return request("PUT", `/feature_requests/${id}`, {
        body: { approval_status: "pending" },
      });
    },

    // ── Comments ───────────────────────────────────────────────────────────

    listComments(params = {}) {
      return request("GET", "/comments", { params });
    },

    getComment(id) {
      return request("GET", `/comments/${id}`);
    },

    createComment({ feature_request_id, comment, internal = false }) {
      return request("POST", "/comments", {
        body: { feature_request_id, comment, internal },
      });
    },

    updateComment(id, { comment, pinned }) {
      return request("PUT", `/comments/${id}`, { body: { comment, pinned } });
    },

    deleteComment(id) {
      return request("DELETE", `/comments/${id}`);
    },

    // ── Merge Posts ──────────────────────────────────────────────────────────

    listMergedPosts(parentId) {
      return request("GET", `/feature_requests/${parentId}/merge_posts`);
    },

    mergePosts(parentId, childIds) {
      return request("POST", `/feature_requests/${parentId}/merge_posts`, {
        body: { child_feature_request_ids: childIds },
      });
    },

    unmergePost(childId) {
      return request("DELETE", `/feature_requests/unmerge/${childId}`);
    },
  };
}
