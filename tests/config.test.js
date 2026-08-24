const test = require("node:test");
const assert = require("node:assert/strict");

const { loadConfig, validateConfig } = require("../src/config");

function validEnvironment(overrides = {}) {
  return {
    NOTION_TOKEN: "test-token",
    NOTION_PAGE_ID: "test-page",
    NOTION_DATA_SOURCE_ID: "test-data-source",
    EMAIL_PROVIDER: "smtp",
    SMTP_USER: "sender@example.com",
    SMTP_APP_PASSWORD: "test-password",
    RECIPIENT_EMAIL: "recipient@example.com",
    ...overrides
  };
}

test("loadConfig does not contain private Notion resource defaults", () => {
  const config = loadConfig({});

  assert.equal(config.notionPageId, "");
  assert.equal(config.notionDatabaseId, "");
  assert.equal(config.notionDataSourceId, "");
});

test("validateConfig requires the Notion page and a deadline source", () => {
  const config = loadConfig(
    validEnvironment({
      NOTION_PAGE_ID: "",
      NOTION_DATA_SOURCE_ID: "",
      NOTION_DATABASE_ID: ""
    })
  );

  assert.throws(
    () => validateConfig(config),
    /NOTION_PAGE_ID, NOTION_DATA_SOURCE_ID or NOTION_DATABASE_ID/
  );
});

test("validateConfig accepts a database ID instead of a data source ID", () => {
  const config = loadConfig(
    validEnvironment({
      NOTION_DATA_SOURCE_ID: "",
      NOTION_DATABASE_ID: "test-database"
    })
  );

  assert.doesNotThrow(() => validateConfig(config));
});
