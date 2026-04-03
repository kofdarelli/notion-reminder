const test = require("node:test");
const assert = require("node:assert/strict");

const { classifyChecklistItems } = require("../src/domain/checklist");
const { extractChecklistItemsFromBlocks } = require("../src/notion/page-reader");

test("extractChecklistItemsFromBlocks finds unchecked todos under weekday headings", () => {
  const blocks = [
    {
      id: "heading-monday",
      type: "heading_3",
      heading_3: {
        rich_text: [{ plain_text: "Monday" }]
      }
    },
    {
      id: "todo-1",
      type: "to_do",
      to_do: {
        checked: false,
        rich_text: [{ plain_text: "Finish odei task" }]
      }
    },
    {
      id: "todo-2",
      type: "to_do",
      to_do: {
        checked: true,
        rich_text: [{ plain_text: "Already done" }]
      }
    },
    {
      id: "heading-tuesday",
      type: "heading_3",
      heading_3: {
        rich_text: [{ plain_text: "Tuesday" }]
      }
    },
    {
      id: "todo-3",
      type: "to_do",
      to_do: {
        checked: false,
        rich_text: [{ plain_text: "338 assignment" }]
      }
    }
  ];

  const items = extractChecklistItemsFromBlocks(blocks, "https://www.notion.so/example");

  assert.deepEqual(
    items.map((item) => ({ title: item.title, weekday: item.weekday })),
    [
      { title: "Finish odei task", weekday: "Monday" },
      { title: "338 assignment", weekday: "Tuesday" }
    ]
  );
});

test("classifyChecklistItems marks today and same-week overdue items", () => {
  const nowContext = {
    weekdayIndex: 2
  };

  const items = classifyChecklistItems(
    [
      { title: "Monday task", weekday: "Monday" },
      { title: "Wednesday task", weekday: "Wednesday" },
      { title: "Friday task", weekday: "Friday" }
    ],
    nowContext
  );

  assert.equal(items.find((item) => item.title === "Monday task").isOverdueInWeek, true);
  assert.equal(items.find((item) => item.title === "Wednesday task").isToday, true);
  assert.equal(items.find((item) => item.title === "Friday task").isOverdueInWeek, false);
});
