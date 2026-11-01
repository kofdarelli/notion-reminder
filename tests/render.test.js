const test = require("node:test");
const assert = require("node:assert/strict");

const { buildEmailPayload } = require("../src/email/render");

test("buildEmailPayload suppresses empty urgent emails", () => {
  const payload = buildEmailPayload({
    nowContext: {
      subjectLabel: "Tue Mar 31",
      hour: 13,
      minute: 0
    },
    deadlineItems: [],
    runType: "urgent",
    timeZone: "Asia/Beirut",
    windowDays: 7
  });

  assert.equal(payload, null);
});

test("buildEmailPayload includes upcoming deadlines but excludes overdue items", () => {
  const payload = buildEmailPayload({
    nowContext: {
      subjectLabel: "Tue Mar 31",
      hour: 7,
      minute: 0
    },
    deadlineItems: [
      { title: "Urgent assignment", isOverdue: true, dueLabel: "1 day overdue", isAssignment: true, course: "EECE 321" },
      { title: "Today quiz", isOverdue: false, dueLabel: "due today", daysUntilDue: 0, isAssignment: false, course: "EECE 334" },
      { title: "Tomorrow quiz", isOverdue: false, dueLabel: "due tomorrow", daysUntilDue: 1, isAssignment: false, course: "EECE 334" }
    ],
    runType: "digest",
    timeZone: "Asia/Beirut",
    windowDays: 7
  });

  assert.match(payload.subject, /^Study Digest - Tue Mar 31$/);
  assert.doesNotMatch(payload.text, /Today's Tasks/);
  assert.match(payload.text, /Upcoming Deadlines/);
  assert.match(payload.text, /Today quiz/);
  assert.match(payload.text, /Tomorrow quiz/);
  assert.doesNotMatch(payload.text, /Urgent assignment/);
});
