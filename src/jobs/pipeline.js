const { classifyDeadlineItems } = require("../domain/deadlines");
const { buildEmailPayload } = require("../email/render");

function prepareReminderPayload({ runType, nowContext, rawDeadlineItems, timeZone, windowDays }) {
  const deadlineItems = classifyDeadlineItems(rawDeadlineItems, nowContext);

  return buildEmailPayload({
    nowContext,
    deadlineItems,
    runType,
    timeZone,
    windowDays
  });
}

module.exports = {
  prepareReminderPayload
};
