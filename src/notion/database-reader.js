const { normalizeNotionDate } = require("../utils/time");

function getPropertyValue(page, propertyName) {
  return page && page.properties ? page.properties[propertyName] : undefined;
}

function extractTitleFromProperties(properties = {}) {
  for (const value of Object.values(properties)) {
    if (value && value.type === "title") {
      return (value.title || []).map((part) => part.plain_text || "").join("").trim();
    }
  }

  return "";
}

function readStatus(page, propertyName) {
  const property = getPropertyValue(page, propertyName);
  return property && property.type === "status" && property.status ? property.status.name : null;
}

function readSelect(page, propertyName) {
  const property = getPropertyValue(page, propertyName);
  return property && property.type === "select" && property.select ? property.select.name : null;
}

function readDate(page, propertyName) {
  const property = getPropertyValue(page, propertyName);
  if (!property || property.type !== "date" || !property.date || !property.date.start) {
    return null;
  }

  return normalizeNotionDate(property.date.start);
}

function readRelationIds(page, propertyName) {
  const property = getPropertyValue(page, propertyName);
  if (!property || property.type !== "relation") {
    return [];
  }

  return (property.relation || []).map((entry) => entry.id).filter(Boolean);
}

function normalizeStudyPage(page, courseTitleMap = new Map()) {
  const title = extractTitleFromProperties(page.properties);
  if (!title) {
    return null;
  }

  const courseIds = readRelationIds(page, "course");
  const courseNames = courseIds
    .map((courseId) => courseTitleMap.get(courseId))
    .filter(Boolean);
  const progress = readStatus(page, "progress");
  const assignmentTag = readSelect(page, "assignment");

  return {
    title,
    source: "database",
    course: courseNames.length > 0 ? courseNames.join(", ") : null,
    progress,
    isAssignment: Boolean(assignmentTag),
    dueDate: readDate(page, "date"),
    notionUrl: page.url
  };
}

async function resolveCourseTitleMap(client, pages) {
  const ids = new Set();

  for (const page of pages) {
    for (const courseId of readRelationIds(page, "course")) {
      ids.add(courseId);
    }
  }

  const entries = await Promise.all(
    [...ids].map(async (id) => {
      try {
        const page = await client.getPage(id);
        return [id, extractTitleFromProperties(page.properties)];
      } catch (error) {
        return [id, null];
      }
    })
  );

  return new Map(entries.filter(([, title]) => Boolean(title)));
}

async function readDeadlineItems(client, { dataSourceId, databaseId }) {
  const pages = await client.queryStudyPages({ dataSourceId, databaseId });
  const courseTitleMap = await resolveCourseTitleMap(client, pages);

  return pages
    .map((page) => normalizeStudyPage(page, courseTitleMap))
    .filter(Boolean);
}

module.exports = {
  normalizeStudyPage,
  readDeadlineItems
};
