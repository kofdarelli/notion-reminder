const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

function getDateFormatter(timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "long"
  });
}

function getSubjectDateFormatter(timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function getZonedDateParts(date, timeZone) {
  const parts = getDateFormatter(timeZone).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    weekdayName: lookup.weekday,
    weekdayIndex: WEEKDAYS.indexOf(lookup.weekday),
    dateKey: `${lookup.year}-${lookup.month}-${lookup.day}`,
    subjectLabel: getSubjectDateFormatter(timeZone).format(date)
  };
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, month, day };
}

function toUtcDayNumber(dateKey) {
  const { year, month, day } = parseDateKey(dateKey);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function differenceInDays(fromDateKey, toDateKey) {
  return toUtcDayNumber(toDateKey) - toUtcDayNumber(fromDateKey);
}

function normalizeNotionDate(value) {
  if (!value) {
    return null;
  }

  return String(value).slice(0, 10);
}

function describeDaysUntilDue(daysUntilDue) {
  if (daysUntilDue < 0) {
    return `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? "" : "s"} overdue`;
  }

  if (daysUntilDue === 0) {
    return "due today";
  }

  if (daysUntilDue === 1) {
    return "due tomorrow";
  }

  return `due in ${daysUntilDue} days`;
}

module.exports = {
  WEEKDAYS,
  describeDaysUntilDue,
  differenceInDays,
  getZonedDateParts,
  normalizeNotionDate
};
