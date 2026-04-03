const assert = require("node:assert/strict");
const { buildEmailPayload } = require("../src/email/render");

const mockData = {
  nowContext: {
    subjectLabel: "Wed Apr 01",
    hour: 8,
    minute: 0
  },
  checklistItems: [
    { title: "Overdue Task", weekday: "Monday", isOverdueInWeek: true, isToday: false, notionUrl: "https://notion.so/overdue" },
    { title: "Today Task", weekday: "Wednesday", isToday: true, notionUrl: "https://notion.so/today" }
  ],
  deadlineItems: [
    { title: "Overdue Deadline", isOverdue: true, dueLabel: "2 days ago", course: "MATH 201", notionUrl: "https://notion.so/deadline-overdue" },
    { title: "Upcoming Deadline", isOverdue: false, dueLabel: "in 3 days", daysUntilDue: 3, course: "PHYS 211", notionUrl: "https://notion.so/deadline-upcoming" }
  ],
  runType: "digest",
  timeZone: "Asia/Beirut",
  windowDays: 7
};

function runTests() {
  console.log("Running Redesign Verification Tests...");

  const payload = buildEmailPayload(mockData);

  // 1. Check for HTML presence
  assert.ok(payload.html, "Payload should contain HTML content");
  assert.ok(payload.html.includes("<!DOCTYPE html>"), "HTML should have doctype");
  assert.ok(payload.html.includes("<style>"), "HTML should contain CSS");

  // 2. Check for Notion link removal
  assert.ok(!payload.text.includes("notion.so"), "Text payload should NOT contain Notion links");
  assert.ok(!payload.html.includes("notion.so"), "HTML payload should NOT contain Notion links");
  assert.ok(!payload.html.includes("https://"), "HTML payload should NOT contain any external HTTPS links (as requested)");

  // 3. Check for TaskFlow-inspired sections
  assert.ok(payload.html.includes("section-overdue"), "HTML should have overdue section class");
  assert.ok(payload.html.includes("section-today"), "HTML should have today section class");
  assert.ok(payload.html.includes("section-upcoming"), "HTML should have upcoming section class");

  // 4. Verify icons/emojis
  assert.ok(payload.html.includes("⚠️"), "HTML should contain warning icon for overdue");
  assert.ok(payload.html.includes("📅"), "HTML should contain calendar icon for tasks");

  console.log("✅ All verification tests passed!");
  
  // Optionally log a bit of HTML for manual inspection
  console.log("\nPreviewing a slice of the generated HTML:");
  console.log(payload.html.substring(0, 500) + "...");
}

try {
  runTests();
} catch (error) {
  console.error("❌ Verification failed:");
  console.error(error);
  process.exit(1);
}
