const { describeDaysUntilDue, differenceInDays } = require("../utils/time");

function classifyDeadlineItems(items, nowContext) {
  return items
    .filter((item) => item.progress !== "done")
    .filter((item) => item.dueDate)
    .map((item) => {
      const daysUntilDue = differenceInDays(nowContext.dateKey, item.dueDate);
      return {
        ...item,
        daysUntilDue,
        isOverdue: daysUntilDue < 0,
        dueLabel: describeDaysUntilDue(daysUntilDue)
      };
    })
    .sort((left, right) => {
      if (left.daysUntilDue !== right.daysUntilDue) {
        return left.daysUntilDue - right.daysUntilDue;
      }
      return left.title.localeCompare(right.title);
    });
}

module.exports = {
  classifyDeadlineItems
};
