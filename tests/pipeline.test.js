const test = require("node:test");
const assert = require("node:assert/strict");

const { prepareReminderPayload } = require("../src/jobs/pipeline");

const nowContext = {
  dateKey: "2026-03-31",
  subjectLabel: "Tue Mar 31",
  hour: 7,
  minute: 0,
  weekdayIndex: 1
};

test("prepareReminderPayload handles page-only data", () => {
  const payload = prepareReminderPayload({
    runType: "digest",
    nowContext,
    rawChecklistItems: [{ title: "Tuesday task", weekday: "Tuesday" }],
    rawDeadlineItems: [],
    timeZone: "Asia/Beirut",
    windowDays: 7
  });

  assert.match(payload.text, /Today's Tasks/);
  assert.match(payload.text, /Tuesday task/);
});

test("prepareReminderPayload handles database-only data", () => {
  const payload = prepareReminderPayload({
    runType: "digest",
    nowContext,
    rawChecklistItems: [],
    rawDeadlineItems: [
      {
        title: "Database deadline",
        progress: "pending",
        dueDate: "2026-04-02",
        isAssignment: true,
        course: "EECE 321"
      }
    ],
    timeZone: "Asia/Beirut",
    windowDays: 7
  });

  assert.match(payload.text, /Upcoming Deadlines/);
  assert.match(payload.text, /Database deadline/);
});

test("prepareReminderPayload handles mixed data", () => {
  const payload = prepareReminderPayload({
    runType: "digest",
    nowContext,
    rawChecklistItems: [
      { title: "Monday task", weekday: "Monday" },
      { title: "Tuesday task", weekday: "Tuesday" }
    ],
    rawDeadlineItems: [
      {
        title: "Overdue deadline",
        progress: "pending",
        dueDate: "2026-03-30",
        isAssignment: true,
        course: "EECE 338"
      },
      {
        title: "Today deadline",
        progress: "pending",
        dueDate: "2026-03-31",
        isAssignment: true,
        course: "EECE 321"
      },
      {
        title: "Tomorrow deadline",
        progress: "pending",
        dueDate: "2026-04-01",
        isAssignment: true,
        course: "EECE 334"
      }
    ],
    timeZone: "Asia/Beirut",
    windowDays: 7
  });

  assert.match(payload.text, /Tuesday task/);
  assert.match(payload.text, /Today deadline/);
  assert.match(payload.text, /Tomorrow deadline/);
  assert.doesNotMatch(payload.text, /Monday task/);
  assert.doesNotMatch(payload.text, /Overdue deadline/);
});
