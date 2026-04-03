const { classifyChecklistItems } = require("../domain/checklist");
const { classifyDeadlineItems } = require("../domain/deadlines");
const { buildEmailPayload } = require("../email/render");

function prepareReminderPayload({
  runType,
  nowContext,
  rawChecklistItems,
  rawDeadlineItems,
  timeZone,
  windowDays
}) {
  const checklistItems = classifyChecklistItems(rawChecklistItems, nowContext);
  const deadlineItems = classifyDeadlineItems(rawDeadlineItems, nowContext);

  return buildEmailPayload({
    nowContext,
    checklistItems,
    deadlineItems,
    runType,
    timeZone,
    windowDays
  });
}

module.exports = {
  prepareReminderPayload
};
