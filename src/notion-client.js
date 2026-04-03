class NotionClient {
  constructor({ token, apiVersion }) {
    this.token = token;
    this.apiVersion = apiVersion;
    this.baseUrl = "https://api.notion.com";
  }

  async request(path, { method = "GET", body } = {}) {
    if (typeof fetch !== "function") {
      throw new Error("Global fetch is not available. Use Node.js 18 or newer.");
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Notion-Version": this.apiVersion,
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = payload.message || `${response.status} ${response.statusText}`;
      const error = new Error(`Notion API request failed: ${message}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  async getPage(pageId) {
    return this.request(`/v1/pages/${pageId}`);
  }

  async listBlockChildren(blockId) {
    let nextCursor = null;
    const results = [];

    do {
      const suffix = nextCursor ? `?start_cursor=${encodeURIComponent(nextCursor)}&page_size=100` : "?page_size=100";
      const payload = await this.request(`/v1/blocks/${blockId}/children${suffix}`);
      results.push(...(payload.results || []));
      nextCursor = payload.has_more ? payload.next_cursor : null;
    } while (nextCursor);

    return results;
  }

  async queryStudyPages({ dataSourceId, databaseId }) {
    const body = { page_size: 100 };

    if (dataSourceId) {
      try {
        return await this.queryPaginated(`/v1/data_sources/${dataSourceId}/query`, body);
      } catch (error) {
        if (!databaseId) {
          throw error;
        }
      }
    }

    if (!databaseId) {
      throw new Error("Neither NOTION_DATA_SOURCE_ID nor NOTION_DATABASE_ID is available.");
    }

    return this.queryPaginated(`/v1/databases/${databaseId}/query`, body);
  }

  async queryPaginated(path, initialBody) {
    let nextCursor = null;
    const results = [];

    do {
      const body = nextCursor
        ? {
            ...initialBody,
            start_cursor: nextCursor
          }
        : initialBody;
      const payload = await this.request(path, { method: "POST", body });
      results.push(...(payload.results || []));
      nextCursor = payload.has_more ? payload.next_cursor : null;
    } while (nextCursor);

    return results;
  }
}

module.exports = {
  NotionClient
};
