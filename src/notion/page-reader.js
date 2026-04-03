const { WEEKDAYS } = require("../utils/time");

const HEADING_TYPES = new Set(["heading_1", "heading_2", "heading_3"]);

function getRichTextPlainText(richText = []) {
  return richText.map((part) => part.plain_text || "").join("").trim();
}

function extractBlockText(block) {
  if (!block || !block.type) {
    return "";
  }

  const value = block[block.type];
  if (!value || !Array.isArray(value.rich_text)) {
    return "";
  }

  return getRichTextPlainText(value.rich_text);
}

async function collectBlocksRecursively(client, blockId) {
  const directChildren = await client.listBlockChildren(blockId);
  const allBlocks = [];

  for (const child of directChildren) {
    allBlocks.push(child);

    if (child.has_children) {
      const nested = await collectBlocksRecursively(client, child.id);
      allBlocks.push(...nested);
    }
  }

  return allBlocks;
}

function normalizeWeekday(text) {
  const cleaned = String(text || "").replace(/[:\-–—]+$/g, "").trim().toLowerCase();
  return WEEKDAYS.find((weekday) => weekday.toLowerCase() === cleaned) || null;
}

function buildBlockUrl(pageUrl, blockId) {
  return blockId ? `${pageUrl}#${blockId.replace(/-/g, "")}` : pageUrl;
}

function extractChecklistItemsFromBlocks(blocks, pageUrl) {
  const items = [];
  let currentWeekday = null;

  for (const block of blocks) {
    if (HEADING_TYPES.has(block.type)) {
      currentWeekday = normalizeWeekday(extractBlockText(block));
      continue;
    }

    if (block.type !== "to_do" || !currentWeekday) {
      continue;
    }

    const title = extractBlockText(block);
    const checked = Boolean(block.to_do && block.to_do.checked);

    if (!checked && title) {
      items.push({
        title,
        source: "page",
        weekday: currentWeekday,
        notionUrl: buildBlockUrl(pageUrl, block.id)
      });
    }
  }

  return items;
}

async function readChecklistItems(client, { pageId }) {
  const page = await client.getPage(pageId);
  const blocks = await collectBlocksRecursively(client, pageId);
  return extractChecklistItemsFromBlocks(blocks, page.url);
}

module.exports = {
  extractChecklistItemsFromBlocks,
  readChecklistItems
};
