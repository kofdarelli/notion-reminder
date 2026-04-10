const test = require("node:test");
const assert = require("node:assert/strict");

const { resolveRunType } = require("../src/jobs/run-reminder");

test("resolveRunType returns digest for a configured digest hour", () => {
  const runType = resolveRunType(
    "auto",
    { digestHours: [7, 20], urgentHour: 13 },
    { hour: 7 }
  );

  assert.equal(runType, "digest");
});

test("resolveRunType returns urgent for the urgent hour", () => {
  const runType = resolveRunType(
    "auto",
    { digestHours: [7, 20], urgentHour: 13 },
    { hour: 13 }
  );

  assert.equal(runType, "urgent");
});

test("resolveRunType returns null for unscheduled hours", () => {
  const runType = resolveRunType(
    "auto",
    { digestHours: [7, 20], urgentHour: 13 },
    { hour: 10 }
  );

  assert.equal(runType, null);
});

test("resolveRunType preserves explicit modes", () => {
  assert.equal(
    resolveRunType("digest", { digestHours: [20], urgentHour: 13 }, { hour: 10 }),
    "digest"
  );
  assert.equal(
    resolveRunType("urgent", { digestHours: [7, 20], urgentHour: 20 }, { hour: 20 }),
    "urgent"
  );
});
