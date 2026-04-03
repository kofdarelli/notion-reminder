const test = require("node:test");
const assert = require("node:assert/strict");

const { classifyDeadlineItems } = require("../src/domain/deadlines");

test("classifyDeadlineItems computes overdue and upcoming deadlines", () => {
  const nowContext = {
    dateKey: "2026-03-31"
  };

  const items = classifyDeadlineItems(
    [
      {
        title: "Overdue assignment",
        progress: "pending",
        dueDate: "2026-03-30",
        isAssignment: true
      },
      {
        title: "Today assignment",
        progress: "pending",
        dueDate: "2026-03-31",
        isAssignment: true
      },
      {
        title: "Tomorrow lecture",
        progress: "not started",
        dueDate: "2026-04-01",
        isAssignment: false
      },
      {
        title: "Completed item",
        progress: "done",
        dueDate: "2026-04-03",
        isAssignment: true
      }
    ],
    nowContext
  );

  assert.equal(items.length, 3);
  assert.equal(items[0].title, "Overdue assignment");
  assert.equal(items[0].isOverdue, true);
  assert.equal(items[1].dueLabel, "due today");
  assert.equal(items[2].dueLabel, "due tomorrow");
});
