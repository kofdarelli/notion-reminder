const { WEEKDAYS } = require("../utils/time");

const WEEKDAY_INDEX = Object.fromEntries(WEEKDAYS.map((weekday, index) => [weekday, index]));

function classifyChecklistItems(items, nowContext) {
  return items
    .map((item) => {
      const weekdayIndex = WEEKDAY_INDEX[item.weekday];
      return {
        ...item,
        weekdayIndex,
        isToday: weekdayIndex === nowContext.weekdayIndex,
        isOverdueInWeek: weekdayIndex < nowContext.weekdayIndex
      };
    })
    .filter((item) => Number.isInteger(item.weekdayIndex));
}

module.exports = {
  classifyChecklistItems
};
