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

test("prepareReminderPayload lists upcoming deadlines", () => {
  const payload = prepareReminderPayload({
    runType: "digest",
    nowContext,
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

test("prepareReminderPayload keeps only deadlines inside the window", () => {
  const payload = prepareReminderPayload({
    runType: "digest",
    nowContext,
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
      },
      {
        title: "Far deadline",
        progress: "pending",
        dueDate: "2026-05-15",
        isAssignment: true,
        course: "EECE 334"
      }
    ],
    timeZone: "Asia/Beirut",
    windowDays: 7
  });

  assert.match(payload.text, /Today deadline/);
  assert.match(payload.text, /Tomorrow deadline/);
  assert.doesNotMatch(payload.text, /Far deadline/);
  assert.doesNotMatch(payload.text, /Tuesday task/);
  assert.doesNotMatch(payload.text, /Overdue deadline/);
});
