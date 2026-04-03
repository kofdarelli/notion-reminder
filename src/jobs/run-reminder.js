const { loadConfig, validateConfig } = require("../config");
const { sendReminderEmail } = require("../email/sender");
const { NotionClient } = require("../notion-client");
const { readDeadlineItems } = require("../notion/database-reader");
const { readChecklistItems } = require("../notion/page-reader");
const { prepareReminderPayload } = require("./pipeline");
const { getZonedDateParts } = require("../utils/time");

function resolveRunType(requestedMode, config, nowContext) {
  if (requestedMode === "digest" || requestedMode === "urgent") {
    return requestedMode;
  }

  if (requestedMode !== "auto") {
    throw new Error(`Unsupported run mode: ${requestedMode}`);
  }

  if (config.digestHours.includes(nowContext.hour)) {
    return "digest";
  }

  if (config.urgentHour === nowContext.hour) {
    return "urgent";
  }

  return null;
}

async function runReminder(mode = "auto", env = process.env) {
  const config = loadConfig(env);
  const nowContext = getZonedDateParts(new Date(), config.timeZone);
  const runType = resolveRunType(mode, config, nowContext);

  if (!runType) {
    console.log(`No reminder scheduled for ${nowContext.hour}:00 in ${config.timeZone}.`);
    return { sent: false, skipped: true };
  }

  validateConfig(config);

  const notionClient = new NotionClient({
    token: config.notionToken,
    apiVersion: config.notionApiVersion
  });

  const [rawChecklistItems, rawDeadlineItems] = await Promise.all([
    readChecklistItems(notionClient, {
      pageId: config.notionPageId
    }),
    readDeadlineItems(notionClient, {
      dataSourceId: config.notionDataSourceId,
      databaseId: config.notionDatabaseId
    })
  ]);

  const payload = prepareReminderPayload({
    runType,
    nowContext,
    rawChecklistItems,
    rawDeadlineItems,
    timeZone: config.timeZone,
    windowDays: config.deadlineWindowDays
  });

  if (!payload) {
    console.log(`No ${runType} reminder to send.`);
    return { sent: false, skipped: true };
  }

  await sendReminderEmail(config, payload);

  console.log(`Sent ${runType} reminder: ${payload.subject}`);
  return { sent: true, subject: payload.subject };
}

module.exports = {
  resolveRunType,
  runReminder
};
